const fetch = require("node-fetch");

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
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
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    console.error("Failed to fetch or parse response as JSON:", e.message);
  }
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  const objArr = JSON.parse(event.body);
  console.log("Received body:", objArr);

  const waterText =
    "in the role of a real estate investor and land surveyor, can you estimate how much pf the selected lot is covered by water or in a flood zone?. In the response, please return the following the full reasoning text followed by a json template that looks like: {estimated percentage flood zone: <>, estimated percentage ground water: <>, and total estimated percentage: <>}";

  const contourText =
    "in the role of a real estate investor and land surveyor, is the majority of the selected lot hilly or relatively flat and buildable?";

  const text = "What is in this image?";
  // waterLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
  // contourLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"

  let results = [];
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    const waterFile = obj.WaterURL;
    const contourFile = obj.ContourURL;

    console.log("Water File: " + waterFile);
    console.log("Contour File: " + contourFile);

    // Await the async calls
    const waterResponse = await openRouterApiRequest(waterFile, waterText);
    const contourResponse = await openRouterApiRequest(
      contourFile,
      contourText
    );

    obj.WaterResponse = waterResponse;
    obj.ContourResponse = contourResponse;
    results.push(obj);
  }
  console.log("Results:", results);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Processed results",
      results: JSON.stringify(results),
    }),
  };
};
