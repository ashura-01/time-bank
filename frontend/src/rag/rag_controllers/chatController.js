export const sendMessageToRag = async (message) => {
  try {
    const response = await fetch('http://localhost:5001/api/chat/ask', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to communicate with chat server');
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error in chatController:', error);
    return "I'm sorry, I am currently unable to connect to the server. Please try again later.";
  }
};
