const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt, modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model: "google/gemini-2.5-flash-lite-preview-09-2025",

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

  const body =
    typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;

  const objArr = Array.isArray(body) ? body : body.myrows;
  const modelName = body.model || body.modelName;

  if (!Array.isArray(objArr)) {
    throw new Error("Expected myrows array in request body");
  }

  console.log(`Received ${objArr.length} row objects`);
  console.log("First row sample:", JSON.stringify(objArr[0], null, 2));
  // const objArr = JSON.parse(event.body);
  // console.log("Received array of spreadsheet row objects:", objArr);
  // ID	ScreenshotURL	PROMPT	StructuresPresent	NealsNotes	Status	PromptVersion	Feedback	Seth Note	UNIFIEDPROMPT	RoadAvailable3	RoadAvailable2	RoadAvailable1	ContourResponse	WaterResponse	ShapeMatch	StructureURL	RoadAvailable4	RoadResponse	POINTS	calculatedPerimeterFeet	calcFrontage	ContourURL	WaterURL	Frontage
  let promises = [];
  let updatedObjs = [];
  let output = [];
  let promiseIndex = 0;

  for (let i = 0; i < objArr.length; i++) {
    let rowObj = objArr[i];
    const screenshotFile = rowObj.screenshotURL;
    const prompt = rowObj.PROMPT;
    console.log("Screenshot File: " + screenshotFile);
    promises.push(openRouterApiRequest(screenshotFile, prompt, modelName));
    rowObj.StructuresPresent = promiseIndex;
    promiseIndex++;
    updatedObjs.push(rowObj);
  }

  console.log("Promises:", promises);

  const results = await Promise.allSettled(promises);
  console.log("Results:", results);

  for (let i = 0; i < updatedObjs.length; i++) {
    let updatedRowObj = updatedObjs[i];
    if (typeof updatedRowObj.StructuresPresent === "number") {
      const result = results[Number(updatedRowObj.StructuresPresent)];
      updatedRowObj.StructuresPresent = result.value;
    }
    
    output.push(updatedRowObj);
  }

  /* const responseBody = {
    message: `Successfully processed ${output.length} rows`,
    results: JSON.stringify(output), // ← Important: send as string
  }; */

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(output),
  };
}