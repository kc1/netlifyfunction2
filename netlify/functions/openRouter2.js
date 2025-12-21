const fetch = require("node-fetch");

async function openRouterApiRequest2(combinedPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // First API call with reasoning
  let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: combinedPrompt,
        },
      ],
      reasoning: { enabled: true },
    }),
  });

  // Extract the assistant message with reasoning_details and save it to the response variable
  const result = await response.json();
  response = result.choices[0].message;
  return response.content; /* return response2.content; */
  // Preserve the assistant message with reasoning_details

  /* const messages = [
    {
      role: "user",
      content: "How many r's are in the word 'strawberry'?",
    },
    {
      role: "assistant",
      content: response.content,
      reasoning_details: response.reasoning_details, // Pass back unmodified
    },
    {
      role: "user",
      content: "Are you sure? Think carefully.",
    },
  ];
 */
  /*   // Second API call - model continues reasoning from where it left off
  const response2 = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: messages, // Includes preserved reasoning_details
      }),
    }
  );

  const result2 = await response2.json();
  response2 = result2.choices[0].message;

  */
}

exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");
  console.log("Event:", event);
  console.log("Context:", context);

  const bodyObj = JSON.parse(event.body);
  // const objArr = JSON.parse(bodyObj.payload);
  console.log("Received array of spreadsheet row objects:", bodyObj);

  const prompt = (county, state) =>
    `in ${county} county , ${state} , can you tell me if an exempt or minor subdivision is possible, and if so what property sizes for the subdivided lots. can also you return minimum road frontage from the subdivided lot. Can you also include minimum buildable area and minimum size of subdivided lot.Finally can you finish by putting links to the relevant county ordinances and subdivision regulations.`;

  let promises = [];
  for (let i = 0; i < bodyObj.length; i++) {
    const myPrompt = prompt(bodyObj[i], "Wisconsin");
    promises.push(openRouterApiRequest2(myPrompt));
  }
  const results = await Promise.allSettled(promises);
  console.log("Results:", results);
  let output = [];
  for (let i = 0; i < results.length; i++) {
    const countyMarkdown = `\n\n<span style="font-size: 18pt"><u><strong>${bodyObj[i]} County, ${state} </strong></u></span>\n\n`;
    output.push({county: countyMarkdown, result: results[i].value});
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
