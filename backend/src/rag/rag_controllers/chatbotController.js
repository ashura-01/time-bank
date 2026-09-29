import OpenAI from 'openai';
import { getVectorCollection } from '../rag_models/vectorDb.js';
import { userRepository } from '../../repositories/userRepository.js';
import { serviceRepository } from '../../repositories/serviceRepository.js';
import { v4 as uuidv4 } from 'uuid';

export const askChatbot = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.EMBED_OPENROUTER_API_KEY || !process.env.LLM_API_KEY) {
      return res.status(500).json({ error: 'API keys are not configured properly' });
    }

    const embedClient = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.EMBED_OPENROUTER_API_KEY,
      defaultHeaders: {
        "Authorization": `Bearer ${process.env.EMBED_OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "TimeBankV2"
      }
    });

    const llmClient = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.LLM_API_KEY,
      defaultHeaders: {
        "Authorization": `Bearer ${process.env.LLM_API_KEY}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "TimeBankV2"
      }
    });

    // 1. Vectorize the User Query
    const embeddingResponse = await embedClient.embeddings.create({
      model: process.env.EMBED_MODEL,
      input: message,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 2. Retrieve Relevant Context via Vector Search
    const collection = getVectorCollection();
    const cursor = collection.aggregate([
      {
        $vectorSearch: {
          index: process.env.RAG_VECTOR_INDEX_NAME || 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 10,
          limit: 3,
        }
      }
    ]);

    const documents = await cursor.toArray();
    const contextText = documents.map(doc => doc.text_content).join('\n\n');

    // 3. Construct the Augmented Prompt
    const systemPrompt = `
You are the official support assistant and agent for TimeBankV2.
You have two main capabilities:
1. Answering policy questions using the provided context.
2. Performing actions on the platform on behalf of the user using the provided tools.

If the user asks a policy question, use the context below. Do not make up information.
If the user asks you to perform an action (like checking their balance, searching for services, or creating a service), MUST use the provided tools.

--- Context ---
${contextText}
----------------
`;

    const tools = [
      {
        type: "function",
        function: {
          name: "get_my_profile",
          description: "Get the current authenticated user's profile information, including their time balance and email.",
          parameters: { type: "object", properties: {} }
        }
      },
      {
        type: "function",
        function: {
          name: "search_services",
          description: "Search for services available in the TimeBank.",
          parameters: {
            type: "object",
            properties: {
              searchQuery: { type: "string", description: "The search term, e.g., 'gardening' or 'teaching'" },
              type: { type: "string", enum: ["offer", "request"], description: "The type of service to search for." }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_service",
          description: "Create a new service offering or request for the user.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the service" },
              description: { type: "string", description: "A detailed description" },
              type: { type: "string", enum: ["offer", "request"], description: "Whether the user is offering to help or requesting help" },
              durationHours: { type: "number", description: "The duration of the service in hours" }
            },
            required: ["title", "description", "type", "durationHours"]
          }
        }
      }
    ];

    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // 4. Generate Initial Response (could be direct answer or tool call)
    let completion = await llmClient.chat.completions.create({
      model: process.env['LLM-MODEL'],
      messages: messages,
      tools: tools,
      tool_choice: "auto"
    });

    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error("LLM failed to return a valid response. This model might not support tool calling, or it is currently overwhelmed.");
    }

    let responseMessage = completion.choices[0].message;

    // 5. Tool Call Processing Loop
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage); // append the assistant's tool call

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        let functionResult = "";

        try {
          if (functionName === "get_my_profile") {
            const profile = await userRepository.findById(req.user.id); // Protected by req.user.id
            functionResult = JSON.stringify(profile);
          } else if (functionName === "search_services") {
            const results = await serviceRepository.findServices({
              search: args.searchQuery,
              type: args.type,
              limit: 5
            });
            functionResult = JSON.stringify(results.services);
          } else if (functionName === "create_service") {
            // Find a default category
            const categories = await serviceRepository.findCategories();
            const categoryId = categories.length > 0 ? categories[0].id : null;

            const newService = await serviceRepository.createService({
              id: uuidv4(),
              providerId: req.user.id, // IDOR Prevention: explicitly using auth context
              categoryId: categoryId,
              title: args.title,
              description: args.description,
              type: args.type,
              durationHours: args.durationHours
            });
            functionResult = JSON.stringify({ success: true, service: newService });
          } else {
            functionResult = JSON.stringify({ error: "Unknown function" });
          }
        } catch (err) {
          functionResult = JSON.stringify({ error: err.message });
        }

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResult
        });
      }

      // Generate the final response after tool execution
      completion = await llmClient.chat.completions.create({
        model: process.env['LLM-MODEL'],
        messages: messages
      });
      
      if (!completion || !completion.choices || completion.choices.length === 0) {
        throw new Error("LLM failed to return a valid response after executing tools.");
      }
      
      responseMessage = completion.choices[0].message;
    }

    const answer = responseMessage.content;
    res.json({ answer });
  } catch (error) {
    console.error('RAG Error:', error);
    next(error);
  }
};
