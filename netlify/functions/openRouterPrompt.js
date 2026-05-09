const fetch = require("node-fetch");

async function openRouterApiRequest(imageLink, myPrompt, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: myPrompt,
          },
          {
            type: "image_url",
            image_url: { url: imageLink },
          },
        ],
      },
    ],
  };

  /* reasoning: {
      effort: "high",
      exclude: false,
      enabled: true,
    },
 */

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(apiEndpoint, options);
    const responseBody = await response.text();
    console.log("Response Code:", response.status);
    console.log("Response Body:", responseBody);

    // Parse the response as JSON
    const jsonResponse = JSON.parse(responseBody);
    console.log(jsonResponse);
    let output = jsonResponse.choices[0].message.content;
    return output;
  } catch (e) {
    console.error("Failed to fetch or parse response as JSON:", e.message);
  }
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  const obj = JSON.parse(event.body);
  console.log("Received a spreadsheet row object:", obj);

// ID	RoadURL	PROMPT	RoadAvailable	NealNotes	Status1	PromptVersion	Feedback
  
    let result;
    const roadFile = obj.RoadURL;
    const prompt = obj.prompt;
    const model = obj.model || "google/gemini-2.5-flash"; // default if not provided
    console.log("Road File: " + roadFile);
    console.log("Prompt: " + prompt);
    console.log("Model: " + model);
    if (roadFile.includes("http") && prompt.length > 0) {
      try {
        result = await openRouterApiRequest(roadFile, prompt, model);
        obj.RoadAvailable = result;
      } catch (e) {
        result = "Error";
      }
    }


    console.log("here is the returned result: ");
    console.log(JSON.stringify(result));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  };
};
