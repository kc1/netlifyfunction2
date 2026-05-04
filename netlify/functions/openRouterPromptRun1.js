const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // model: "google/gemini-2.5-flash-lite",
  // model: "google/gemini-2.5-flash-lite-preview-09-2025",
  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  // include_reasoning: true,
  /* reasoning: {
      max_tokens: 1000,
    // } */

  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  /*   const payload = {
    model: "google/gemma-4-26b-a4b-it",
    reasoning: { enabled: true },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: myPrompt },
          { type: "image_url", image_url: { url: imageLink } },
        ],
      },
    ],
  };
 */
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

  const objArr = JSON.parse(event.body);
  console.log("Received array of spreadsheet row objects:", objArr);

    const roadAvailabilityPrompt2 = `

Act as an experienced real estate investor and professional land surveyor, with expertise in maps and GIS. 

Step 1: Focus exclusively on the map portion of the provided screenshot (ignore any code or text editor panels). Locate the primary highlighted lot, which is a light gray polygon with a thin,
consistent width black border.

Step 2: Thoroughly inspect the interior of the selected lot and its entire perimeter for any road. A road is defined as any clearly distinguishable linear or **curvilinear** path that appears suitable for vehicular traffic (cars, trucks, construction equipment, etc.). **As observed in the current image example, roads typically appear as a distinct, consistent and significant width, stretch of dark gray, characterized by clear edges.** This appearance may include textual labels (e.g., "N Shiloh Rd"). **Note that other property lines, often depicted in orange, are NOT part of the road itself and must be ignored when identifying the road.** This explicitly includes public roads, private roads, driveways, access lanes, or easements — even if unpaved or newly graded. Look for named roads or unnamed, but clearly defined, vehicular paths.

Once you have identified the lot boundaries:
Examine the area strictly **inside** the polygon. Determine whether there is a physical road that intersects or lies within or partly within the enclosed boundary of the lot. Do NOT count roads that are adjacent, or running outside the property lines.

Be aware that the image may contain other visual elements such as other property lines (e.g., orange lines), non-selected parcel markings, or informational overlays. These are **not relevant** to your primary task of assessing the selected lot for road access and should be disregarded for that purpose. Your focus is strictly on the selected blue-bordered lot and its immediate surroundings for road identification.

Respond in this exact format:
1. Provide your full reasoning and analysis based only on what is inside the lot boundaries.
2. Add two blank newlines.
3. Output the separator: -----------
4. Add two more blank newlines.
5. Output a valid JSON object in this exact structure (use string values "Yes" or "No" only):
\`\`\`json
{
  "AvailableRoad": "Yes|No"
}
\`\`\`
The JSON must be valid, properly formatted, and contain only the "AvailableRoad" key with "Yes" or "No".

`;

  let promises = [];
  let myObjs = [];
  let roadFile;
  let promiseIndices = [];
  
// ID	STARTPROMPT	RoadURL	RoadAvailable	NealNotes	Status	PromptVersion	Feedback	RoadAvailable3	RoadAvailable2	RoadAvailable1	ContourResponse	WaterResponse	RoadResponse	POINTS	calculatedPerimeterFeet	calcFrontage	ContourURL	WaterURL	Frontage	LAT	LON	PARNO	ALTPARNO	calculatedAreaAcres	PPIN	OWNNAME	MAILADD1	MCITY1	MSTATE1	MZIP1	MAILADD2	MCITY2	MSTATE2	MZIP2	SITEADD	SCITY	SSTATE	SZIP	TAXACRES	GISACRES	DEEDREF	DEEDDATE	PLATREF	PLATDATE	TAXMAP	SECTION	TWSP	RANGE	TAXSTATUS	STNAME	CNTYNAME	CNTYFIPS	STFIPS	STCNTYFIPS	LANDVAL	IMPVAL1	IMPVAL2	TOTVAL	CULT_AC1	CULT_AC2	UNCULT_AC1	UNCULT_AC2	TOTAL_AC	LATDEC	LONGDEC	ZONING	LEGLDESC	TAXYEAR	INSIDE_X	INSIDE_Y	SHAPE_Leng	SHAPE_Area	name	link	property	address	parcel	taxes	taxesRaw	acres	appraisalRecordLink	assessedValueForTaxation	balanceStatus	countyTaxBalance	countyTaxDue	countyTaxPaid	improvementsValue	landValue	legalDescription	mailingAddress	ownerName	parcelNumber	reportDate	schoolTaxDue	taxSaleDocumentsLink	taxStatus	taxYear	totalAssessedValue	totalTaxBalance	totalTaxDue	totalTaxPaid	taxSaleHistory_2022_redeemed	taxSaleHistory_2022_soldTo	taxSaleHistory_2022_year	taxSaleHistory_2018_redeemed	taxSaleHistory_2018_soldTo	taxSaleHistory_2018_year	taxSaleHistory_2024_redeemed	taxSaleHistory_2024_soldTo	taxSaleHistory_2024_year		
  
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
      roadFile = obj.RoadURL;
      const prompt = obj.STARTPROMPT;
      console.log("Road File: " + roadFile);
      promises.push(openRouterApiRequest(roadFile, prompt));
      promiseIndices.push(myObjs.length);
      myObjs.push(obj);
    }
  }

  console.log("Promises:", promises);

  const results = await Promise.allSettled(promises);
  console.log("Results:", results);

  let output = [];
  for (let i = 0; i < results.length; i++) {
    const objIndex = promiseIndices[i];
    const myObj = myObjs[objIndex];
    const result = results[i];
    if (result.status === "fulfilled") {
      myObj.RoadAvailable = result.value;
    } else if (result.status === "rejected") {
      myObj.RoadAvailable = "Error" ;
    }
  }

  for (let i = 0; i < myObjs.length; i++) {
    output.push(myObjs[i]);
  }

  console.log("here is the returned array");
  console.log(JSON.stringify(output));

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
