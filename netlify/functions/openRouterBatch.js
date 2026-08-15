const fetch = require("node-fetch");
// google/gemini-3.7-flash:batch,
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

/** Accept drive/dropbox style links without scheme; OpenRouter expects a usable URL string. */
function normalizeImageUrl(raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return "https:" + s;
  if (/^[a-z0-9][a-z0-9+.-]*:\/\//i.test(s)) return s;
  if (
    /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s) ||
    /\.(com|net|org|io|app)(\/|$)/i.test(s)
  ) {
    return "https://" + s.replace(/^\/+/, "");
  }
  return s;
}

function screenshotUrlFromRow(rowObj) {
  return (
    rowObj.ScreenshotURL ||
    rowObj.screenshotURL ||
    rowObj.screenshotUrl ||
    rowObj.screenshot ||
    ""
  );
}

function promptFromRow(rowObj) {
  const p =
    (typeof rowObj.prompt === "string" && rowObj.prompt) ||
    (typeof rowObj.PROMPT === "string" && rowObj.PROMPT) ||
    (typeof rowObj.Prompt === "string" && rowObj.Prompt) ||
    "";
  return p.trim();
}


async function openRouterApiRequest(imageLink, myPrompt, modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  // model: "google/gemini-2.5-flash-lite-preview-09-2025",
  const payload = {
    model: modelName,
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
    if (!response.ok || jsonResponse.error) {
      throw new Error(
        jsonResponse.error?.message || `OpenRouter HTTP ${response.status}`,
      );
    }
    if (!jsonResponse.choices?.[0]?.message?.content) {
      throw new Error("OpenRouter response missing choices[0].message.content");
    }
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    console.error("OpenRouter request failed:", e.message);
    throw e;
  }
}

/** Dropbox share links need raw=1 so OpenRouter can fetch image bytes. */
function dropboxDirectImageUrl(raw) {
  let url = normalizeImageUrl(raw);
  if (!url || !/dropbox\.com/i.test(url)) return url;
  url = url.replace(/([?&])dl=0\b/gi, "$1raw=1");
  if (!/[?&]raw=1\b/i.test(url)) {
    url += (url.includes("?") ? "&" : "?") + "raw=1";
  }
  return url;
}

async function createBatchRequestItem(customId, imageLink, myPrompt, modelName = "google/gemini-3.7-flash:batch") {
  const cid =
    customId == null || customId === "" ? `id-${Date.now()}` : String(customId);
  const output = {
    custom_id: cid,
    body: {
      model: modelName,
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
              image_url: {
                url: imageLink,
              },
            },
          ],
        },
      ],
    },
  };
  console.log(JSON.stringify(output, null, 2));
  return output;
}

async function submitBatchJob(requestArray,modelName = "google/gemini-3.7-flash:batch") {
  const payload = {
    endpoint: "/v1/chat/completions",
    model: modelName,
    requests: requestArray,
  };
  return payload;
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  const body =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

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
  let requests = [];
  let promiseIndex = 0;

  for (let i = 0; i < objArr.length; i++) {
    let rowObj = objArr[i];
    const screenshotFile = normalizeImageUrl(screenshotUrlFromRow(rowObj));
    const prompt = promptFromRow(rowObj);
    console.log("Screenshot File:", screenshotFile.substring(0, 120));
    if (!screenshotFile || !prompt) {
      console.warn(
        `Row ${i}: skipping OpenRouter — missing ${!screenshotFile ? "image URL" : "prompt"}`,
      );
      rowObj.StructuresPresent = { error: "missing image URL or prompt" };
      // requests.push(rowObj);
      continue;
    }
    const customId = rowObj.ID;
    requests.push(
      await createBatchRequestItem(customId, screenshotFile, prompt, modelName),
    );
  }
  
  console.log("Requests:", JSON.stringify(requests, null, 2));
  const payload = await submitBatchJob(requests, modelName);
  console.log("Payload:", JSON.stringify(payload));

  const apiKey = process.env.OPENROUTER_API_KEY;
  const response = await fetch("https://openrouter.ai/api/beta/batches", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const batchData = await response.json();
  console.log("Batch submission response:", JSON.stringify(batchData, null, 2));
  console.log("Batch submitted! ID:", batchData.id);

  // Save the ID to disk so you can check it later
  /* fs.writeFileSync(
    "last_batch_id.json",
    JSON.stringify({ batchId: batchData.id }, null, 2),
  ); */

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batchId: batchData.id }),
  };
};