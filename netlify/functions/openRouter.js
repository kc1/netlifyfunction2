const fetch = require("node-fetch");

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model: "google/gemini-2.5-flash",
    // model: "google/gemini-2.5-flash-lite-preview-09-2025",
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

  const objArr = JSON.parse(event.body);
  console.log("Received array of spreadsheet row objects:", objArr);

  const waterText =
    'in the role of a real estate investor and land surveyor, can you estimate how much pf the selected lot is covered by water or in a flood zone?. You can use the legend on the left of the image. Please be aware that flood zones or surface water usually have curvilinear or rounded borders, and have some blue, or blue/green, but are not totally green in color. In the response, please return the following: the full reasoning text ,followed by 2 empty newlines, followed by string ----------- , followed by 2 newlines, followed by a json template that looks like: {"estimated percentage flood zone": <integer only>, "estimated percentage ground water": <integer only>, "total estimated percentage": <integer only>}"; make sure its valid JSON';

  const contourText =
    'in the role of a real estate investor and land surveyor, is the majority of the selected lot hilly or relatively flat and buildable? In the response, please return the following: the full reasoning text, followed by 2 empty newlines, followed by a string ----------- , followed by 2 newlines, followed by a json template that looks like: {"estimated percentage of lot that is hilly": <integer only>, "estimated percentage of lot that is flat": <integer only>, "estimated percentage of lot that is buildable": <integer only>}"; make sure its valid JSON';

  const roadText =
    'in the role of a real estate investor and land surveyor, How many roads border the property in blue? In the response, please return the following: the full reasoning text, followed by 2 empty newlines, followed by a string ----------- , followed by 2 newlines, followed by a json template that looks like: {"roadNumberInteger": <integer only>} make sure its valid JSON';

  const text = "What is in this image?";
  // waterLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
  // contourLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"

  let promises = [];
  let myObjs = [];
  let waterFile, contourFile, roadFile;
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    if (obj.WaterURL && ['', '{}'].includes(obj.RoadResponse)) {
      waterFile = obj.WaterURL;
      console.log("Water File: " + waterFile);
      promises.push(openRouterApiRequest(waterFile, waterText));
      obj.WaterResponse = "PENDING";
      myObjs.push(obj);
    }
    if (obj.ContourURL && ['', '{}'].includes(obj.ContourResponse)) {
      contourFile = obj.ContourURL;
      console.log("Contour File: " + contourFile);
      promises.push(openRouterApiRequest(contourFile, contourText));
      obj.ContourResponse = "PENDING";
      myObjs.push(obj);
    }
    if (obj.ContourURL && ['', '{}'].includes(obj.RoadResponse)) {
      // Note: using ContourURL for Road as well, adjust if needed
      roadFile = obj.ContourURL;
      console.log("Road File: " + roadFile);
      promises.push(openRouterApiRequest(roadFile, roadText));
      obj.RoadResponse = "PENDING";
      myObjs.push(obj);
    }
  }

  console.log("Promises:", promises);

  const results = await Promise.allSettled(promises);
  console.log("Results:", results);

  let output = [];
  for (let i = 0; i < myObjs.length; i++) {
    const myObj = myObjs[i];
    const result = results[i];
    if (result.status === "fulfilled") {
      if (myObj.WaterResponse === "PENDING") {
        myObj.WaterResponse = result.value;
      } else if (myObj.ContourResponse === "PENDING") {
        myObj.ContourResponse = result.value;
      } else if (myObj.RoadResponse === "PENDING") {
        myObj.RoadResponse = result.value;
      }
    } else if (result.status === "rejected") {
      if (myObj.WaterResponse === "PENDING") {
        myObj.WaterResponse = "Error: " + result.reason.message;
      } else if (myObj.ContourResponse === "PENDING") {
        myObj.ContourResponse = "Error: " + result.reason.message;
      } else if (myObj.RoadResponse === "PENDING") {
        myObj.RoadResponse = "Error: " + result.reason.message;
      }
    }
    output.push(myObj);
  }

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