require("dotenv").config();
const { MongoClient } = require("mongodb");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatMessageHistory } = require("langchain/memory"); // <-- Add this import

// MongoDB setup
const murl = process.env.MONGODB_URI;
const client = new MongoClient(murl);
let database;
let isConnected = false;

async function getDatabase() {
  if (!isConnected) {
    await client.connect();
    database = client.db("mydata");
    isConnected = true;
  }
  return database;
}

// Helper: fetch documents from MongoDB
async function fetchMongoDBData(filterObj, collName) {
  const db = await getDatabase();
  const collection = db.collection(collName);
  return await collection.find(filterObj).toArray();
}

// Helper: callOpenRouter2 (stub, replace with your actual implementation)
async function callOpenRouter2(newfile, combinedPrompt) {
  // Implement your LLM/image API call here
  return { status: "stub", prompt: combinedPrompt, file: newfile?.name };
}

// exports.handler = async function (event, context) {
//   if (event.httpMethod !== "POST") {
//     return { statusCode: 405, body: "Method Not Allowed" };
//   }

//   // Parse incoming JSON
//   let body;
//   try {
//     body = JSON.parse(event.body);
//   } catch (e) {
//     return { statusCode: 400, body: "Invalid JSON" };
//   }

//   const { newfile, prompt, coll = "contextThreads", topicId = "test" } = body;

//   // 1. Query MongoDB for context chats with topicId
//   const filterObj = { topicId };
//   let contextDocs = [];
//   try {
//     // contextDocs = await fetchMongoDBData(filterObj, coll);
//     contextDocs = await fetchMongoDBData({}, coll); // all records
//   } catch (e) {
//     return { statusCode: 500, body: "MongoDB query failed" };
//   }

//   // 2. Extract and combine chat histories
//   let contextMessages = [];
//   if (Array.isArray(contextDocs)) {
//     contextDocs.forEach((doc) => {
//       if (Array.isArray(doc.history)) {
//         contextMessages = contextMessages.concat(doc.history);
//       } else if (Array.isArray(doc.chat_history)) {
//         contextMessages = contextMessages.concat(doc.chat_history);
//       } else if (Array.isArray(doc.chatHistory)) {
//         contextMessages = contextMessages.concat(doc.chatHistory);
//       }
//     });
//   }

//   // 3. Combine context with the new prompt
//   let combinedPrompt = "";
//   contextMessages.forEach((msg) => {
//     if (msg.data && msg.data.content) {
//       combinedPrompt += msg.data.content + "\n";
//     } else if (msg.content) {
//       combinedPrompt += msg.content + "\n";
//     }
//   });
//   combinedPrompt += prompt;

//   // 4. Send the image and combined prompt to the LLM
//   let llmResponse;
//   try {
//     llmResponse = await callOpenRouter2(newfile, combinedPrompt);
//   } catch (e) {
//     return { statusCode: 500, body: "LLM call failed" };
//   }

//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message: "LLM response",
//       llmResponse,
//     }),
//     headers: { "Content-Type": "application/json" },
//   };
// };

// New code to handle fetching chat history and using LangChain's ChatMessageHistory
exports.handler = async function (event, context) {
  // Parse incoming JSON
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { imageFile, prompt, coll = "contextThreads", topicId = "test" } = body;
  // const { userId } = body;

  const filterObj = { topicId };
  // Fetch chat history from MongoDB
  const db = await getDatabase();
  const collection = db.collection(coll);
  // const doc = await collection.find({ topicId: topicId }).limit(1).toArray().then(docs => docs[0]);
  // Fetch all documents with the given topicId
  const docs = await collection.find({ topicId: topicId }).toArray();
  // Use LangChain's ChatMessageHistory
  const chatHistory = new ChatMessageHistory();
  for (const doc of docs) {
    const history = doc.history || doc.chat_history || doc.chatHistory;
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.type === "human" && msg.data?.content?.[0]?.text) {
          await chatHistory.addUserMessage(msg.data.content[0].text);
        } else if (msg.type === "ai" && msg.data?.content?.[0]?.text) {
          await chatHistory.addAIMessage(msg.data.content[0].text);
        } else if (msg.content && msg.type === "human") {
          await chatHistory.addUserMessage(msg.content);
        } else if (msg.content && msg.type === "ai") {
          await chatHistory.addAIMessage(msg.content);
        }
      }
    }
  }
  // if (doc && doc.chat_history) {
  //   for (const msg of doc.chat_history) {
  //     if (msg.type === "human") {
  //       await chatHistory.addUserMessage(msg.data.content[0].text);
  //     } else if (msg.type === "ai") {
  //       await chatHistory.addAIMessage(msg.data.content[0].text);
  //     }
  //   }
  // }

  // Now you can use chatHistory.getMessages() to get the formatted history
  const messages = await chatHistory.getMessages();

  // Use messages as context for ChatOpenAI
  const llm = new ChatOpenAI({ temperature: 0.1 });
  // Set up OpenRouter as the model provider for LangChain's ChatOpenAI
  llm.openAIApiKey = process.env.OPENROUTER_API_KEY;
  llm.openAIApiBase = "https://openrouter.ai/api/v1";
  llm.model = "openrouter/your-model-name"; // e.g., "openrouter/mistralai/mixtral-8x7b"
  // Example: send messages as context
  const response = await llm.invoke([
    ...messages,
    // Add the new user message here if needed
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...(imageFile
          ? [{ type: "image_url", image_url: imageFile }]
          : [])
      ]
    }
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "LLM response",
      llmResponse,
    }),
    headers: { "Content-Type": "application/json" },
  };
};