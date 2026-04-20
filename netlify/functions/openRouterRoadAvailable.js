const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // model: "google/gemini-2.5-flash-lite-preview-09-2025",
  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: "google/gemini-2.5-flash-lite",
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
    reasoning: {
      effort: "high",
      exclude: false,
      enabled: true,
    },
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

  const objArr = JSON.parse(event.body);
  console.log("Received array of spreadsheet row objects:", objArr);

  const roadAvailabilityPrompt = `
  You are an experienced real estate investor and professional land surveyor.
  Analyze the provided image and locate the selected lot. The lot is clearly outlined by a thin bright blue boundary line and has a central marker consisting of white letters "id" on a black background, followed by a red period.
  Once you have confirmed the exact boundaries of the selected lot:
  Determine whether there is a road lying within or immediately adjacent to the lot.
  Then respond in this exact format:
  1. Provide your full reasoning and analysis.
 2. Add two blank newlines.
 3. Output the separator: -----------
 4. Add two more blank newlines.
 5. Output a valid JSON object in this exact structure:
  {
   "AvailableRoad": <Yes/No>
 }
  Ensure the JSON is valid, properly formatted, and contains only the allowed values for orientation.
 `;

  let promises = [];
  let myObjs = [];
  let waterFile; // well use waterURL
  // ID	ContourURL	WaterURL	ContourResponse	WaterResponse	RoadResponse	POINTS	calculatedPerimeterFeet	 calcFrontage	Frontage
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    if (obj.WaterURL) {
      waterFile = obj.WaterURL;
      console.log("Water File: " + waterFile);
      promises.push(openRouterApiRequest(waterFile, roadAvailabilityPrompt));
      myObjs.push(obj);
    }
  }

  console.log("Promises:", promises);

  const results = await Promise.allSettled(promises);
  console.log("Results:", results);

  let output = [];
  for (let i = 0; i < myObjs.length; i++) {
    let myObj = myObjs[i];
    const result = results[i];
    if (result.status === "fulfilled") {
      myObj.RoadAvailable = result.value;
    } else if (result.status === "rejected") {
      myObj.RoadAvailable = "Error: " + result.reason.message;
    }
    output.push(myObj);
  }

  console.log("here is the returned array");
  console.log(JSON.stringify(output));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Processed results",
      results: JSON.stringify(output),
    }),
  };
};
