const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // model: "google/gemini-2.5-flash-lite",
  // model: "google/gemini-2.5-flash-lite-preview-09-2025",
  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  // include_reasoning: true,
  /* reasoning: {
      max_tokens: 1000,
    // } */

  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  /*   const payload = {
    model: "google/gemma-4-26b-a4b-it",
    reasoning: { enabled: true },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: myPrompt },
          { type: "image_url", image_url: { url: imageLink } },
        ],
      },
    ],
  };
 */
  const payload = {
    model: "google/gemini-2.5-flash",
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

/*   const payload = {
    task: "refine_prompt",
    imageUrl: row.RoadURL,
    prompt: optimizerPrompt,        // ← This is what gets sent to the model
    currentPrompt: row.PROMPT,      // Optional: for reference
    wrongAnswer: row.RoadAvailable,
    correctAnswer: row.NealNotes,
    rowId: row.ID
  }; */

// ID	RoadURL	PROMPT	RoadAvailable	NealNotes	Status1	PromptVersion	Feedback
  
    let result;
    const roadFile = obj.RoadURL;
    const prompt = obj.prompt;
    console.log("Road File: " + roadFile);
    console.log("Prompt: " + prompt);
    if (roadFile.includes("http") && prompt.length > 0) {
      try {
        result = await openRouterApiRequest(roadFile, prompt);
        obj.RoadAvailable = result;
      } catch (e) {
        result = "Error";
      }
    }


    console.log("here is the returned result: ");
    console.log(JSON.stringify(obj));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Processed results",
      results: obj,
    }),
  };
};
