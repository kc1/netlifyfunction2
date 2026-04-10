const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt) {
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
  let objArr;

  try {
    if (typeof event.body === "string") {
      objArr = JSON.parse(event.body);
    } else if (event.body && typeof event.body === "object") {
      objArr = event.body; // in case it's already parsed (rare)
    } else {
      throw new Error("No body received");
    }

    console.log(`Received ${objArr.length} row objects`);
    console.log("First row sample:", JSON.stringify(objArr[0], null, 2));
    // const objArr = JSON.parse(event.body);
    // console.log("Received array of spreadsheet row objects:", objArr);

    const waterText =
      'in the role of a real estate investor and land surveyor, Please find the selected lot within the provided image. The selected lot is contained by a thin bright blue line. It also has a central mark with the white letters "id" on a black background followed by a red period. After confirming the boundaries of the selected lot, can you estimate how much of the selected lot is covered by water or in a flood zone? You can use the legend on the left of the image to see some of the colors of areas of ground water or flood zone. Please be aware that flood zones or surface water usually have curvilinear or rounded borders, and have some blue, or blue/green, but are not totally green in color. These are noted to have a thin black line as a border of the same thickness as the bright blue boundary of the selected lot. In the response, please return the following: the full reasoning text ,followed by 2 empty newlines, followed by string ----------- , followed by 2 newlines, followed by a json template that looks like: {"estimated percentage flood zone": <integer only>, "estimated percentage ground water": <integer only>, "total estimated percentage": <integer only>}"; make sure its valid JSON';

    const contourText =
      'in the role of a real estate investor and land surveyor, is the majority of the selected lot hilly or relatively flat and buildable? In the response, please return the following: the full reasoning text, followed by 2 empty newlines, followed by a string ----------- , followed by 2 newlines, followed by a json template that looks like: {"estimated percentage of lot that is hilly": <integer only>, "estimated percentage of lot that is flat": <integer only>, "estimated percentage of lot that is buildable": <integer only>}"; make sure its valid JSON';

    const roadText =
      'in the role of a real estate investor and land surveyor, How many roads border the property in blue? In the response, please return the following: the full reasoning text, followed by 2 empty newlines, followed by a string ----------- , followed by 2 newlines, followed by a json template that looks like: {"roadNumberInteger": <integer only>} make sure its valid JSON';

    const text = "What is in this image?";
    // waterLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
    // contourLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"

    let promises = [];
    let updatedObjs = [];
    let output = [];
    let promiseIndex = 0;
    let waterFile, contourFile, roadFile;

    for (let i = 0; i < objArr.length; i++) {
      let rowObj = objArr[i];
      if (rowObj.WaterURL && ["", "{}"].includes(rowObj.WaterResponse)) {
        waterFile = rowObj.WaterURL;
        console.log("Water File: " + waterFile);
        promises.push(openRouterApiRequest(waterFile, waterText));
        rowObj.WaterResponse = promiseIndex;
        promiseIndex++;
        // myObjs.push(obj);
      }
      if (rowObj.ContourURL && ["", "{}"].includes(rowObj.ContourResponse)) {
        contourFile = rowObj.ContourURL;
        console.log("Contour File: " + contourFile);
        promises.push(openRouterApiRequest(contourFile, contourText));
        rowObj.ContourResponse = promiseIndex;
        promiseIndex++;
        // myObjs.push(obj);
      }
      if (rowObj.RoadURL && ["", "{}"].includes(rowObj.RoadResponse)) {
        // Note: using ContourURL for Road as well, adjust if needed
        roadFile = rowObj.RoadURL;
        console.log("Road File: " + roadFile);
        promises.push(openRouterApiRequest(roadFile, roadText));
        rowObj.RoadResponse = promiseIndex;
        promiseIndex++;
        // myObjs.push(obj);
      }

      updatedObjs.push(rowObj);
    }

    console.log("Promises:", promises);

    const results = await Promise.allSettled(promises);
    console.log("Results:", results);

    for (let i = 0; i < updatedObjs.length; i++) {
      let updatedRowObj = updatedObjs[i];
      if (typeof updatedRowObj.WaterResponse === "number") {
        const result = results[Number(updatedRowObj.WaterResponse)];
        updatedRowObj.WaterResponse = result.value;
      }
      if (typeof updatedRowObj.ContourResponse === "number") {
        const result = results[Number(updatedRowObj.ContourResponse)];
        updatedRowObj.ContourResponse = result.value;
      }
      if (typeof updatedRowObj.RoadResponse === "number") {
        const result = results[Number(updatedRowObj.RoadResponse)];
        updatedRowObj.RoadResponse = result.value;
      }

      output.push(updatedRowObj);
    }

    const responseBody = {
      message: `Successfully processed ${output.length} rows`,
      results: JSON.stringify(output), // ← Important: send as string
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);

    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error processing request",
        results: JSON.stringify([]),
        error: error.message,
      }),
    };
  }
};
