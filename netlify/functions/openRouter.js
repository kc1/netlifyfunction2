const fetch = require("node-fetch");

function callOpenRouter2(imageLink, prompt) {
  function imageTest() {
    const text = "What is in this image?";
    // const imageLink = 'https://www.dropbox.com/scl/fi/b7tfviennf40hgz5c5lrn/wi_Marathon_7830082140992_contours.png?rlkey=plpddg83p82dxcebndlg9xlla&dl=0';
    const imageLink =
      "https://www.dropbox.com/scl/fi/b7tfviennf40hgz5c5lrn/wi_Marathon_7830082140992_contours.png?rlkey=plpddg83p82dxcebndlg9xlla&raw=1";

    let x = callOpenRouter2(imageLink, text);
  }

  var url = "https://openrouter.ai/api/v1/chat/completions";

  var headers = {
    Authorization:
      "Bearer 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",
    "Content-Type": "application/json",
  };

  // "model": "meta-llama/llama-3.2-90b-vision-instruct",

  var payload = {
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt, // No need to manually add quotes
          },
          {
            type: "image_url",
            image_url: {
              url: imageLink, // Use the passed parameter
            },
          },
        ],
      },
    ],
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true, // Allows handling of non-200 responses
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var result = response.getContentText();
    Logger.log("Response: " + result);
    return result;
  } catch (error) {
    Logger.log("Error: " + error);
  }
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  let postedFilename = null;
  if (event.httpMethod === "POST") {
    try {
      const data = JSON.parse(event.body);
      postedFilename = data.filename;
      console.log("Received filename:", postedFilename);
    } catch (error) {
      console.error("Error parsing the request body:", error);
    }
  }

  var waterFile = filteredRow.WaterURL;
  var contourFile = filteredRow.ContourURL;

  Logger.log("Water File: " + waterFile);
  Logger.log("Contour File: " + contourFile);

  const waterText =
    "in the role of a real estate investor and land surveyor, can you estimate how much pf the selected lot is covered by water or in a flood zone?. In the response, please use no more than 30 text characters,with no markdown, giving only the estimated percentage flood zone, estimated percentage ground water, and total estimated percentage";

  const waterText1 =
    "in the role of a real estate investor and land surveyor, can you estimate how much pf the selected lot is covered by water or in a flood zone?. In the response, please return the following template only: {estimated percentage flood zone: <>, estimated percentage ground water: <>, and total estimated percentage: <>";

  const contourText =
    "in the role of a real estate investor and land surveyor, is the majority of the selected lot hilly or relatively flat and buildable?";

  const text = "What is in this image?";
  // waterLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
  // contourLink = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"

  let waterResponse = callOpenRouter2(waterFile, waterText1);
  let contourResponse = callOpenRouter2(contourFile, contourText);

  const wro = JSON.parse(waterResponse);
  const cro = JSON.parse(contourResponse);

  const wr = wro.choices[0].message.content;
  const cr = cro.choices[0].message.content;

  // Call createThyroidReport and wait for its response.
  const response = await createThyroidReport();
  console.log("Response from createThyroidReport:", response);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello World",
      // filename: postedFilename,
      // response: response,
    }),
  };
};
