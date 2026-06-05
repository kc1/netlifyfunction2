const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
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

async function openRouterApiRequest3(imageLink, myPrompt, modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    temperature: 0.0, // for consistent classification
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: [
          // === STATIC CACHED PART (Instructions + Examples) ===
          {
            type: "text",
            text: `${myPrompt}\n\nHere are some examples:\n\nExample 1:`,
          },
          {
            type: "image_url",
            image_url: { url: "https://www.dropbox.com/scl/fi/nkeiumknhqjajh9cfdon5/010418-00400-1780440917-building.png?rlkey=nd0tqq4qyn0lu3eitigpjc94i&raw=1" },
            cache_control: { type: "ephemeral" }, // Important
          },
          {
            type: "text",
            text: "lot_found:YES , StructuresPresent:NO",
          },

          {
            type: "text",
            text: "Example 2:",
          },
          {
            type: "image_url",
            image_url: { url: "https://www.dropbox.com/scl/fi/c0m6wpynhpjbxh30bvc6b/010419-01800-1780441370-building.png?rlkey=jdzo979pof6bsr1t21kk0l7wx&raw=1" },
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: "lot_found:YES , StructuresPresent:NO",
          },
          {
            type: "text",
            text: "\nNow classify this new image:",
          },
          {
            type: "image_url",
            image_url: { url: imageLink }, // This one should NOT be cached
          },
        ],
      },
    ],
    // Optional but recommended
    temperature: 0.0, // for consistent classification
    max_tokens: 100,
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

/** Default Yes/No few-shot PNGs from Dropbox (Netlify env vars). */
function fewShotExamplesFromEnv() {
  const examples = [];
  const yesUrl = process.env.OPENROUTER_FEW_SHOT_YES_URL;
  const noUrl = process.env.OPENROUTER_FEW_SHOT_NO_URL;
  if (yesUrl) {
    examples.push({ imageUrl: dropboxDirectImageUrl(yesUrl), answer: "Yes" });
  }
  if (noUrl) {
    examples.push({ imageUrl: dropboxDirectImageUrl(noUrl), answer: "No" });
  }
  return examples;
}

/**
 * Few-shot vision request for Gemini 2.5 Flash via OpenRouter.
 * @param {string} imageLink - Target screenshot (Dropbox or other URL)
 * @param {string} myPrompt - Per-row classification prompt
 * @param {string} [modelName] - OpenRouter model id (default: google/gemini-2.5-flash)
 * @param {object} [options]
 * @param {Array<{imageUrl?: string, url?: string, answer: string}>} [options.examples] - Few-shot pairs; defaults to env URLs
 * @param {string} [options.systemInstruction] - Opening instruction before examples
 */
async function openRouterApiRequest2(
  imageLink,
  myPrompt,
  modelName,
  options = {},
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const examples =
    options.examples?.length > 0
      ? options.examples.map((ex) => ({
          imageUrl: dropboxDirectImageUrl(ex.imageUrl || ex.url),
          answer: String(ex.answer).trim(),
        }))
      : fewShotExamplesFromEnv();

  const targetUrl = dropboxDirectImageUrl(imageLink);
  const model = modelName || "google/gemini-2.5-flash";

  const exampleMessages = examples.flatMap(({ imageUrl, answer }) => [
    {
      role: "user",
      content: [
        { type: "text", text: "Example image:" },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
    { role: "assistant", content: answer },
  ]);

  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              options.systemInstruction ||
              "You classify property screenshots. Reply with exactly one word: Yes or No.",
          },
        ],
      },
      ...exampleMessages,
      {
        role: "user",
        content: [
          { type: "text", text: myPrompt },
          { type: "image_url", image_url: { url: targetUrl } },
        ],
      },
    ],
  };

  const requestOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(apiEndpoint, requestOptions);
    const responseBody = await response.text();
    console.log("Response Code:", response.status);
    console.log("Response Body:", responseBody);

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
  let output = [];
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
      updatedObjs.push(rowObj);
      continue;
    }
    promises.push(openRouterApiRequest3(screenshotFile, prompt, modelName));
    rowObj.StructuresPresent = promiseIndex;
    promiseIndex++;
    updatedObjs.push(rowObj);
  }

  console.log("Promises:", promises);

  const results = await Promise.allSettled(promises);
  console.log("Results:", results);

  let settledIndex = 0;
  for (let i = 0; i < updatedObjs.length; i++) {
    let updatedRowObj = updatedObjs[i];
    if (typeof updatedRowObj.StructuresPresent === "number") {
      const result = results[settledIndex++];
      updatedRowObj.StructuresPresent =
        result.status === "fulfilled"
          ? result.value
          : { error: result.reason?.message || String(result.reason) };
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
};
