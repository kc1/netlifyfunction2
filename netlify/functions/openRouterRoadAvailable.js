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

  const objArr = JSON.parse(event.body);
  console.log("Received array of spreadsheet row objects:", objArr);

  const roadAvailabilityPrompt = `
You are an experienced real estate investor and professional land surveyor with expertise in aerial/satellite imagery analysis and lot development feasibility.

Carefully analyze the provided image. The selected lot is **unambiguously** marked by:
- A thin, bright blue boundary line outlining the exact perimeter.
- A central marker inside the lot consisting of white letters "id" on a black rectangular background, followed immediately by a red period (i.e., the label "id.").

Step 1: First confirm you have correctly identified the selected lot by its blue boundary and central "id." marker. Ignore all other lots or markings.

Step 2: Thoroughly inspect the interior of the lot and its entire perimeter for any road. A road is defined as any clearly distinguishable paved, gravel, dirt, or graded path that appears suitable for vehicular traffic (cars, trucks, construction equipment, etc.). This explicitly includes public roads, private roads, driveways, access lanes, or easements — even if unpaved.

Step 3: Determine if a road lies **within** the lot boundaries OR is **immediately adjacent** to the lot.
- "Immediately adjacent" means the road either:
  - Directly touches any portion of the blue boundary line, OR
  - Is separated from the blue boundary by only a very narrow strip (sidewalk, curb, grass verge, drainage ditch, or similar).
- To estimate "immediately adjacent," use this clear rule of thumb: the visible gap between the road edge and the blue boundary line must be **less than 4 times the visible width of that road** in the image (this accounts for scale and perspective distortion). If the gap is larger, it is NOT immediately adjacent.

Step 4: If any part of a qualifying road meets the above criteria (inside or immediately adjacent), the answer is Yes. Otherwise, it is No. Base your decision strictly on visible evidence in the image. If image quality is poor or features are ambiguous, default to No and explain why in your reasoning.

Respond in this exact format — do not deviate:

1. Provide your full reasoning and analysis (include: lot confirmation, description of any roads found, distance/gap assessment using the 4× rule, and final decision rationale).
2. Add two blank newlines.
3. Output the separator: -----------
4. Add two more blank newlines.
5. Output a valid JSON object in this exact structure (use string values "Yes" or "No" only):

{
  "AvailableRoad": "Yes"
}

The JSON must be valid, properly formatted, and contain only the "AvailableRoad" key with "Yes" or "No".
`;

  let promises = [];
  let myObjs = [];
  let contourFile; // well use waterURL
  // ID	ContourURL	WaterURL	ContourResponse	WaterResponse	RoadResponse	POINTS	calculatedPerimeterFeet	 calcFrontage	Frontage
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    if (obj.ContourURL) {
      contourFile = obj.ContourURL;
      console.log("Contour File: " + contourFile);
      promises.push(openRouterApiRequest(contourFile, roadAvailabilityPrompt));
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
