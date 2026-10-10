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
    // Use the passed modelName, fallback to Gemini 2.5 Flash
    // model: modelName || "google/gemini-2.5-flash",
    // model:"google/gemini-3.5-flash",
    model: "google/gemini-3-flash-preview",
    // model:"google/gemini-embedding-2",
    // Force OpenRouter/Gemini to return a valid JSON object without markdown fences
    response_format: { type: "json_object" },
    temperature: 0.0, // Best for consistent classification
    // reasoning: { visual: true }, // Enable visual reasoning for image inputs
    reasoning: {
      max_tokens: 2000, // Allow more tokens for detailed reasoning if needed
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${myPrompt}\n\nHere are some examples:`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Example 1:",
          },
          {
            type: "image_url",
            image_url: {
              url: "https://www.dropbox.com/scl/fi/nkeiumknhqjajh9cfdon5/010418-00400-1780440917-building.png?rlkey=nd0tqq4qyn0lu3eitigpjc94i&raw=1",
            },
            cache_control: { type: "ephemeral" },
          },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            // MUST MATCH YOUR JSON SCHEMA EXACTLY
            text: `{\n  "lot_found": "YES",\n  "StructuresPresent": "NO",\n  "structures": [],\n  "notes": "No structures or building footprints are visible within the darker shaded highlighted parcel boundary."\n}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Example 2:",
          },
          {
            type: "image_url",
            image_url: {
              url: "https://www.dropbox.com/scl/fi/c0m6wpynhpjbxh30bvc6b/010419-01800-1780441370-building.png?rlkey=jdzo979pof6bsr1t21kk0l7wx&raw=1",
            },
            cache_control: { type: "ephemeral" },
          },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            // MUST MATCH YOUR JSON SCHEMA EXACTLY
            text: `{\n  "lot_found": "YES",\n  "StructuresPresent": "YES",\n  "structures": [],\n  "notes": "The darker shaded lot area contains a rectangular structure."\n}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Example 3:",
          },
          {
            type: "image_url",
            image_url: {
              url: "https://www.dropbox.com/scl/fi/7pdpvnnpke0kbzponq6of/010420-00501-1780441811-building.png?rlkey=c5wy6oaso4mz1nfkg29n2k9cp&raw=1",
            },
            cache_control: { type: "ephemeral" },
          },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            // MUST MATCH YOUR JSON SCHEMA EXACTLY

            text: `{\n  "lot_found": "YES",\n  "StructuresPresent": "NO",\n  "structures": [],\n  "notes": "No structures or building footprints are visible within the darker shaded highlighted parcel boundary."\n}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Now classify this new image:",
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

    // Optional: Keep for debugging, but you may want to remove these logs in production
    // console.log("Response Code:", response.status);
    // console.log("Response Body:", responseBody);

    const jsonResponse = JSON.parse(responseBody);

    if (!response.ok || jsonResponse.error) {
      throw new Error(
        jsonResponse.error?.message || `OpenRouter HTTP ${response.status}`,
      );
    }
    if (!jsonResponse.choices?.[0]?.message?.content) {
      throw new Error("OpenRouter response missing choices[0].message.content");
    }

    // Returns the raw JSON string provided by the model
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    console.error("OpenRouter request failed:", e.message);
    throw e;
  }
}

// openRouterPromptWater

async function openRouterApiRequest(imageLink, myPrompt, modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  // model: "google/gemini-2.5-flash-lite-preview-09-2025",openRouterPrompt2
  // model: modelName || "google/gemini-2.5-flash",
  modelName = "google/gemini-3.8-flash";
  // google/gemini-3-flash-preview
  // modelName = "google/gemini-3.1-flash-lite"
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
  const model = modelName || "google/gemini-3-flash-preview";

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

function getWaterPrompt() {
  return ` Act as an expert land surveyor and GIS analyst specializing in parcel and flood zone/ground water assessment.
    Your task: Evaluate the highlighted parcel for buildability based on its ground water, wetland, and flood zone profile. Focus on the light blue, cyan, and patterned shaded areas (which indicate FEMA floodplains, wetlands, and surface water).
    All properties in this evaluation have been prescreened and confirmed to have road access. Therefore, do not evaluate whether road access exists — assume it does along the named roads bordering or crossing the parcel boundaries.
    Decision Rule:
    The lot is considered buildable (YES) ONLY if BOTH conditions are met:
    a) The total water/flood zone coverage (all blue/cyan areas STRICTLY INSIDE the parcel) is LESS THAN 50% of the total internal lot area.
    b) The clear, unshaded (tan/beige) dry land is easily accessible from at least one bordering road without having to cross significant water or floodways. Any major internal water bodies or flood zones must remain situated away from the primary road access areas.
    If the internal water/flood zone coverage is ≥50%, OR if the unshaded dry land is entirely cut off from all adjacent roads by an internal flood zone/wetland, the lot is NOT buildable (NO).
    Step 1: Identify the highlighted lot.
    Find the primary parcel being evaluated. It is enclosed by a distinct, solid RED outline. 
    CRITICAL: Focus only on the area enclosed by this RED boundary line. Massive flood zones or water bodies frequently border the property directly on the outside—you must actively ignore all environmental features to the outside of the parcel line. Do not allow adjacent external floodways to artificially inflate your estimate of the internal area. Ignore UI elements, side menus, text boxes, and search bars.
    Step 2: Water & Flood Coverage Analysis (Critical Filter)
    Carefully evaluate only the space inside the RED outline. Estimate the percentage of the highlighted parcel covered by the blue/cyan/teal shaded features (referring to the map's legend for Floodway, 100-year, 500-year, and Wetlands).
    Locate the main roads (sometimes indicated by white/yellow lines and labels like "County Rd 161") bordering the parcel.
    Determine if the clear, unshaded (beige/tan) land is accessible directly from these roads, or if the internal water features block that access from all available road frontages.
    Step 3: Output Requirements
    You must respond with ONLY a raw, valid JSON object following exactly this schema. Do not include markdown formatting, markdown code blocks, or any conversational text outside the JSON.
    JSON Schema:
    {
    "Analysis_LotFound": "Yes/No. State if you found the parcel enclosed by the RED outline.",
    "Analysis_WaterCoverage": "Detailed assessment of the flood/wetland percentage STRICTLY INSIDE the parcel boundaries (include approximate %) and its position relative to the main roads (e.g., 'Internal flood zone blocks all highway access' or 'Dry land accessible directly from the northern road').",
    "Buildable": "Yes/No",
    "Reasoning": "Brief summary of the final decision based exclusively on the internal water coverage percentage and road accessibility criteria."
    }`;
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  const body =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  const objArr = Array.isArray(body) ? body : body.myrows;
  // const modelName = body.model || body.modelName;

  if (!Array.isArray(objArr)) {
    throw new Error("Expected myrows array in request body");
  }

  let modelName = "google/gemini-3-flash-preview";

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
    const prompt = getWaterPrompt();
    console.log("Screenshot File:", screenshotFile.substring(0, 120));
    if (!screenshotFile || !prompt) {
      console.warn(
        `Row ${i}: skipping OpenRouter — missing ${!screenshotFile ? "image URL" : "prompt"}`,
      );
      rowObj.StructuresPresent = { error: "missing image URL or prompt" };
      updatedObjs.push(rowObj);
      continue;
    }
    promises.push(openRouterApiRequest(screenshotFile, prompt, modelName));
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
      updatedRowObj.GeneratedResponse =
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
