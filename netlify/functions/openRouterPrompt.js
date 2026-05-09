const fetch = require("node-fetch");

/** Accept drive/dropbox style links without scheme; OpenRouter expects a usable URL string. */
function normalizeImageUrl(raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return "https:" + s;
  if (/^[a-z0-9][a-z0-9+.-]*:\/\//i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s) || /\.(com|net|org|io|app)(\/|$)/i.test(s)) {
    return "https://" + s.replace(/^\/+/, "");
  }
  return s;
}

function hasVisionInput(roadRaw, promptText) {
  const road = normalizeImageUrl(roadRaw);
  const p = typeof promptText === "string" ? promptText.trim() : "";
  const ok = Boolean(road && /^https?:\/\//i.test(road) && p.length > 0);
  return { ok, roadNormalized: road, prompt: p };
}

async function openRouterApiRequest(imageLink, myPrompt, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: model,
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

async function openRouterTextOnlyRequest(myPrompt, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model: model,
    messages: [{ role: "user", content: myPrompt }],
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
    console.log("Text-only Response Code:", response.status);
    const jsonResponse = JSON.parse(responseBody);
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    console.error("Text-only OpenRouter failed:", e.message);
  }
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  let obj;
  try {
    obj = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    if (!obj || typeof obj !== "object") throw new Error("body not an object");
  } catch (parseErr) {
    console.warn("Invalid JSON body", parseErr.message);
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  console.log("Received payload keys:", Object.keys(obj));

// ID	RoadURL	PROMPT	RoadAvailable	NealNotes	Status1	PromptVersion	Feedback

    let result;
    const roadFileRaw = obj.RoadURL || obj.roadURL || "";
    const promptPlain =
      (typeof obj.prompt === "string" && obj.prompt) ||
      (typeof obj.PROMPT === "string" && obj.PROMPT) ||
      (typeof obj.Prompt === "string" && obj.Prompt) ||
      "";
    const promptForModel =
      promptPlain.trim() ||
      (obj.promptBody && String(obj.promptBody)) ||
      (obj.message && String(obj.message)) ||
      "";
    const model = obj.model || obj.Model || "google/gemini-2.5-flash"; // default if not provided
    const task = (obj.Task || obj.task || "").trim();
    const taskSlug = task.toLowerCase().replace(/-/g, "_");
    const taskCompact = task.replace(/[\s_-]/gi, "").toLowerCase();
    const vision = hasVisionInput(roadFileRaw, promptForModel);
    console.log(
      "Road (raw/normalized)",
      JSON.stringify({
        raw: String(roadFileRaw).substring(0, 120),
        normalized: vision.roadNormalized.substring(0, 120),
        visionOk: vision.ok,
      }),
    );
    console.log(
      "Prompt length:",
      promptForModel.length,
      "model:",
      model,
      "task:",
      JSON.stringify(task),
    );

    const textOnlyAllowed =
      taskSlug === "create_unified_prompt" ||
      taskSlug === "text_only" ||
      taskSlug === "refine_prompt" ||
      taskCompact === "createunifiedprompt" ||
      obj.textOnly === true ||
      obj.text_only === true;

    try {
      if (vision.ok) {
        result = await openRouterApiRequest(
          vision.roadNormalized || normalizeImageUrl(roadFileRaw),
          promptForModel,
          model,
        );
        obj.RoadAvailable = result;
      } else if (textOnlyAllowed && promptForModel.length > 0) {
        console.warn(
          "Vision inputs missing or unusable URL; falling back to text-only (task=%s)",
          task || "(none)",
        );
        result = await openRouterTextOnlyRequest(promptForModel, model);
        if (
          !(task === "create_unified_prompt" || task === "text_only") &&
          typeof result === "string"
        ) {
          obj.RoadAvailable = result;
        }
      } else {
        console.warn("Missing or invalid RoadURL/prompt in request body.", {
          visionOk: vision.ok,
          task,
          promptLen: promptForModel.length,
          roadLen: String(roadFileRaw).length,
        });
        result = { error: "Missing or invalid RoadURL/prompt" };
      }
    } catch (e) {
      console.error("OpenRouter request failed:", e);
      result = "Error";
    }

    console.log("here is the returned result: ");
    console.log(JSON.stringify(result));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  };
};
