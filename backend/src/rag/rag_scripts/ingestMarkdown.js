import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (now 3 levels up since this is inside src/rag/rag_scripts/)
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.EMBED_OPENROUTER_API_KEY,
  defaultHeaders: {
    "Authorization": `Bearer ${process.env.EMBED_OPENROUTER_API_KEY}`,
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "TimeBankV2"
  }
});

const uri = process.env.RAG_MONGODB_URI;
const client = new MongoClient(uri);

function chunkText(text, maxChunkSize = 800) {
  const paragraphs = text.split('\n\n');
  let chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) < maxChunkSize) {
      currentChunk += p + '\n\n';
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p + '\n\n';
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

async function run() {
  try {
    if (!process.env.EMBED_OPENROUTER_API_KEY) {
      throw new Error("Missing EMBED_OPENROUTER_API_KEY in .env");
    }

    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db(process.env.RAG_DB_NAME);
    const collection = db.collection(process.env.RAG_COLLECTION_NAME);

    // Path to the Terms Policy Markdown file
    const mdFilePath = path.join(__dirname, '../../terms/terms_policy.md');

    if (!fs.existsSync(mdFilePath)) {
      console.error(`\n❌ Error: File not found at ${mdFilePath}`);
      console.error(`Please create your 'terms_policy.md' file in the root timebank directory first!`);
      process.exit(1);
    }

    const markdownContent = fs.readFileSync(mdFilePath, 'utf8');

    const chunks = chunkText(markdownContent);
    console.log(`Split document into ${chunks.length} chunks.`);

    await collection.deleteMany({});
    console.log("Cleared old vectors from collection.");

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);

      const embeddingResponse = await openai.embeddings.create({
        model: process.env.EMBED_MODEL,
        input: chunk,
      });

      const embedding = embeddingResponse.data[0].embedding;

      await collection.insertOne({
        text_content: chunk,
        embedding: embedding,
        metadata: {
          source: 'terms_policy.md',
          chunk_index: i
        }
      });
    }

    console.log("\n✅ Successfully ingested markdown file into MongoDB Atlas Vector Search!");
  } catch (err) {
    console.error("Error during ingestion:", err);
  } finally {
    await client.close();
  }
}

run();
