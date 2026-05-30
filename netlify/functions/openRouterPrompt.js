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
    // Accept screenshotURL variants (newer prompt sources may send this)
    const screenshotRaw =
      obj.ScreenshotURL || obj.screenshotURL || obj.screenshotUrl || obj.screenshot || "";
    // Prefer screenshotRaw when provided, otherwise fall back to roadFileRaw
    const imageSourceRaw = screenshotRaw || roadFileRaw;
    const promptPlain =
      (typeof obj.prompt === "string" && obj.prompt) ||
      (typeof obj.PROMPT === "string" && obj.PROMPT) ||
      (typeof obj.Prompt === "string" && obj.Prompt) ||
      "";
    const promptForModel = promptPlain.trim();
    const model = obj.model || obj.Model || "google/gemini-2.5-flash"; // default if not provided
    const imageToUse = normalizeImageUrl(imageSourceRaw);

    console.log(
      "Image request",
      JSON.stringify({
        raw: String(imageSourceRaw).substring(0, 120),
        normalized: imageToUse.substring(0, 120),
        source: screenshotRaw ? "screenshotURL" : "roadURL",
      }),
    );
    console.log("Prompt length:", promptForModel.length, "model:", model);

    try {
      result = await openRouterApiRequest(imageToUse, promptForModel, model);
      if (screenshotRaw) {
        obj.ScreenshotAvailable = result;
      } else {
        obj.RoadAvailable = result;
      }
    } catch (e) {
      console.error("OpenRouter request failed:", e);
      result = { error: "OpenRouter request failed" };
    }

    console.log("here is the returned result: ");
    // console.log(JSON.stringify(result));
    console.log(result);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: result,
  };
}