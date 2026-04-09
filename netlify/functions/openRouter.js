const fetch = require("node-fetch");
// model: "google/gemini-2.5-flash",
// model: "google/gemini-2.5-flash-preview-09-2025",
// "model": "google/gemini-3-flash-preview",

async function openRouterApiRequest(imageLink, myPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // console.log("API Key:", apiKey);
  // Replace apiKey above with a secure value in production

  // const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model: "google/gemini-2.5-flash-lite-preview-09-2025",

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

// event.body' is {"method":"post","contentType":"application/json","payload":"[{\\"ID\\":1,\\"ContourURL\\":\\"https://www.dropbox.com/scl/fi/4a3gkbzgocc5i0z3j182r/MS-ALCORN-01041700200-1775602859-contours.png?rlkey=ygw835cvch7ad3cbs53br31f2&raw=1\\",\\"WaterURL\\":\\"https://www.dropbox.com/scl/fi/q50eecaypf0r6j9n7jgxr/MS-ALCORN-01041700200-1775602859-water.png?rlkey=halpnvknmfpzftngmo31ekcib&raw=1\\",\\"ContourResponse\\":\\"\\",\\"WaterResponse\\":\\"\\",\\"RoadResponse\\":\\"\\",\\"POINTS\\":\\"\\",\\"calculatedPerimeterFeet\\":\\"\\",\\"calcFrontage\\":\\"\\",\\"Frontage\\":\\"\\",\\"LON\\":-88.3756630389764,\\"LAT\\":34.9918824820891,\\"PARNO\\":\\"010417        00200\\",\\"ALTPARNO\\":\\"010417        00200\\",\\"calculatedAreaAcres\\":\\"\\",\\"PPIN\\":2,\\"OWNNAME\\":\\"GMO THRESHOLD TIMBER COURTLAND LLC\\",\\"MAILADD1\\":\\"RENEWABLE RESOURCES LLC\\",\\"MCITY1\\":\\"WAYNESBORO\\",\\"MSTATE1\\":\\"TN\\",\\"MZIP1\\":38485,\\"MAILADD2\\":\\"% AMERICAN FOREST MANAGEMENT INC\\",\\"MCITY2\\":\\"WAYNESBORO\\",\\"MSTATE2\\":\\"TN\\",\\"MZIP2\\":38485,\\"SITEADD\\":0,\\"SCITY\\":\\"\\",\\"SSTATE\\":\\"MS\\",\\"SZIP\\":38834,\\"TAXACRES\\":155.6,\\"GISACRES\\":156.453856099,\\"DEEDREF\\":\\"2014 - 1431\\",\\"DEEDDATE\\":\\"2014-04-09T04:00:00.000Z\\",\\"PLATREF\\":\\"\\",\\"PLATDATE\\":\\"1970-01-01T00:00:00.000Z\\",\\"TAXMAP\\":104,\\"SECTION\\":17,\\"TWSP\\":1,\\"RANGE\\":9,\\"TAXSTATUS\\":0,\\"STNAME\\":\\"MS\\",\\"CNTYNAME\\":\\"ALCORN\\",\\"CNTYFIPS\\":3,\\"STFIPS\\":28,\\"STCNTYFIPS\\":28003,\\"LANDVAL\\":24860,\\"IMPVAL1\\":0,\\"IMPVAL2\\":0,\\"TOTVAL\\":24860,\\"CULT_AC1\\":0,\\"CULT_AC2\\":0,\\"UNCULT_AC1\\":0,\\"UNCULT_AC2\\":155.6,\\"TOTAL_AC\\":155.6,\\"LATDEC\\":34.9920942499,\\"LONGDEC\\":-88.3767266082,\\"ZONING\\":\\"\\",\\"LEGLDESC\\":\\"PT SW 1/4 & PT N 1/2 SE 1/4\\",\\"TAXYEAR\\":2023,\\"INSIDE_X\\":1121011.1075,\\"INSIDE_Y\\":1998327.23516,\\"SHAPE_Leng\\":24859.8681313,\\"SHAPE_Area\\":6815129.97168,\\"name\\":\\"GMO THRESHOLD TIMBER COURTLAND\\",\\"link\\":\\"/cgi-lrm5/LRMCGI02?HTMCNTY=MS02&HTMBASE=C&HTMKEY=MS020000002202500&HTMODB=&HTMPGM=&HTMPFL=&\\",\\"property\\":0,\\"address\\":\\"\\",\\"parcel\\":\\"010417        00200\\",\\"taxes\\":0,\\"taxesRaw\\":0,\\"acres\\":155.6,\\"appraisalRecordLink\\":\\"/cgi-apm5/APMCGI02?HTMCNTY=MS02&HTMBASE=C&HTMKEY=000002&\\",\\"assessedValueForTaxation\\":3669,\\"balanceStatus\\":\\"BALANCE\\",\\"countyTaxBalance\\":0,\\"countyTaxDue\\":246.8,\\"countyTaxPaid\\":246.8,\\"improvementsValue\\":\\"**NA**\\",\\"landValue\\":24460,\\"legalDescription\\":\\"PT SW 1/4 & PT N 1/2 SE 1/4\\",\\"mailingAddress\\":\\"RENEWABLE RESOURCES LLC, % AMERICAN FOREST MANAGEMENT I, WAYNESBORO TN 38485\\",\\"ownerName\\":\\"GMO THRESHOLD TIMBER COURTLAND\\",\\"parcelNumber\\":\\"010417        00200\\",\\"reportDate\\":\\"3/ 7/2026\\",\\"schoolTaxDue\\":193.58,\\"taxSaleDocumentsLink\\":\\"http://www.deltacomputersystems.com/cgi-lrm4/LRMCGISL?HTMCNTY=WWWTAX&\\",\\"taxStatus\\":\\"PAID\\",\\"taxYear\\":\\"Tax Year  2025\\",\\"totalAssessedValue\\":24460,\\"totalTaxBalance\\":0,\\"totalTaxDue\\":440.38,\\"totalTaxPaid\\":440.38,\\"taxSaleHistory_2022_redeemed\\":\\"\\",\\"taxSaleHistory_2022_soldTo\\":\\"\\",\\"taxSaleHistory_2022_year\\":\\"\\",\\"taxSaleHistory_2018_redeemed\\":\\"\\",\\"taxSaleHistory_2018_soldTo\\":\\"\\",\\"taxSaleHistory_2018_year\\":\\"\\",\\"taxSaleHistory_2024_redeemed\\":\\"\\",\\"taxSaleHistory_2024_soldTo\\":\\"\\",\\"taxSaleHistory_2024_year\\":\\"\\",\\"relativeRow\\":1,\\"absoluteRow\\":2},{\\"ID\\":2,\\"ContourURL\\":\\"https://www.dropbox.com/scl/fi/s42ngjuhvncz023m7gngt/MS-ALCORN-01041700400-1775603353-contours.png?rlkey=7wv1fdmgq52076roolucz2fyk&raw=1\\",\\"WaterURL\\":\\"https://www.dropbox.com/scl/fi/8okmst4g15qrd1a72xidh/MS-ALCORN-01041700400-1775603353-water.png?rlkey=69q3akcyjm60pdohk90xhql35&raw=1\\",\\"ContourResponse\\":\\"\\",\\"WaterResponse\\":\\"\\",\\"RoadResponse\\":\\"\\",\\"POINTS\\":\\"\\",\\"calculatedPerimeterFeet\\":\\"\\",\\"calcFrontage\\":\\"\\",\\"Frontage\\":\\"\\",\\"LON\\":-88.3690960852323,\\"LAT\\":34.9911564840599,\\"PARNO\\":\\"010417        00400\\",\\"ALTPARNO\\":\\"010417        00400\\",\\"calculatedAreaAcres\\":\\"\\",\\"PPIN\\":4,\\"OWNNAME\\":\\"WARRINER HOLDINGS LLC\\",\\"MAILADD1\\":\\"2800 WEST MAIN COTTAGE 405\\",\\"MCITY1\\":\\"TUPELO\\",\\"MSTATE1\\":\\"MS\\",\\"MZIP1\\":38801,\\"MAILADD2\\":\\"\\",\\"MCITY2\\":\\"TUPELO\\",\\"MSTATE2\\":\\"MS\\",\\"MZIP2\\":38801,\\"SITEADD\\":0,\\"SCITY\\":\\"\\",\\"SSTATE\\":\\"MS\\",\\"SZIP\\":38834,\\"TAXACRES\\":53.33,\\"GISACRES\\":53.5859210894,\\"DEEDREF\\":\\"2021 - 3346\\",\\"DEEDDATE\\":\\"2021-07-14T04:00:00.000Z\\",\\"PLATREF\\":\\"\\",\\"PLATDATE\\":\\"1970-01-01T00:00:00.000Z\\",\\"TAXMAP\\":104,\\"SECTION\\":17,\\"TWSP\\":1,\\"RANGE\\":9,\\"TAXSTATUS\\":0,\\"STNAME\\":\\"MS\\",\\"CNTYNAME\\":\\"ALCORN\\",\\"CNTYFIPS\\":3,\\"STFIPS\\":28,\\"STCNTYFIPS\\":28003,\\"LANDVAL\\":8910,\\"IMPVAL1\\":0,\\"IMPVAL2\\":0,\\"TOTVAL\\":8910,\\"CULT_AC1\\":0,\\"CULT_AC2\\":0,\\"UNCULT_AC1\\":0,\\"UNCULT_AC2\\":53.33,\\"TOTAL_AC\\":53.33,\\"LATDEC\\":34.9904413193,\\"LONGDEC\\":-88.3694591755,\\"ZONING\\":\\"\\",\\"LEGLDESC\\":\\"PT S 1/2 SE 1/4 KENDRICK FARMS\\",\\"TAXYEAR\\":2023,\\"INSIDE_X\\":1123190.63047,\\"INSIDE_Y\\":1997735.65685,\\"SHAPE_Leng\\":12030.1005287,\\"SHAPE_Area\\":2334202.72265,\\"name\\":\\"WARRINER HOLDINGS LLC\\",\\"link\\":\\"/cgi-lrm5/LRMCGI02?HTMCNTY=MS02&HTMBASE=C&HTMKEY=MS020000004202500&HTMODB=&HTMPGM=&HTMPFL=&\\",\\"property\\":0,\\"address\\":\\"\\",\\"parcel\\":\\"010417        00400\\",\\"taxes\\":0,\\"taxesRaw\\":0,\\"acres\\":53.33,\\"appraisalRecordLink\\":\\"/cgi-apm5/APMCGI02?HTMCNTY=MS02&HTMBASE=C&HTMKEY=000004&\\",\\"assessedValueForTaxation\\":1313,\\"balanceStatus\\":\\"BALANCE\\",\\"countyTaxBalance\\":0,\\"countyTaxDue\\":88.11,\\"countyTaxPaid\\":88.11,\\"improvementsValue\\":\\"**NA**\\",\\"landValue\\":8750,\\"legalDescription\\":\\"PT S 1/2 SE 1/4\\",\\"mailingAddress\\":\\"2001 LANDMARK BLVD, APT 271, TUPELO MS 38804\\",\\"ownerName\\":\\"WARRINER HOLDINGS LLC\\",\\"parcelNumber\\":\\"010417        00400\\",\\"reportDate\\":\\"3/ 8/2026\\",\\"schoolTaxDue\\":69.27,\\"taxSaleDocumentsLink\\":\\"http://www.deltacomputersystems.com/cgi-lrm4/LRMCGISL?HTMCNTY=WWWTAX&\\",\\"taxStatus\\":\\"PAID\\",\\"taxYear\\":\\"Tax Year  2025\\",\\"totalAssessedValue\\":8750,\\"totalTaxBalance\\":0,\\"totalTaxDue\\":157.38,\\"totalTaxPaid\\":157.38,\\"taxSaleHistory_2022_redeemed\\":\\"\\",\\"taxSaleHistory_2022_soldTo\\":\\"\\",\\"taxSaleHistory_2022_year\\":\\"\\",\\"taxSaleHistory_2018_redeemed\\":\\"\\",\\"taxSaleHistory_2018_soldTo\\":\\"\\",\\"taxSaleHistory_2018_year\\":\\"\\",\\"taxSaleHistory_2024_redeemed\\":\\"\\",\\"taxSaleHistory_2024_soldTo\\":\\"\\",\\"taxSaleHistory_2024_year\\":\\"\\",\\"relativeRow\\":2,\\"absoluteRow\\":3}]","muteHttpExceptions":true}'
  const bodyObj = JSON.parse(event.body);
  
  const objArr = JSON.parse(bodyObj.payload);
  
  console.log("Received array of spreadsheet row objects:", objArr);

  const waterText =
    'in the role of a real estate investor and land surveyor, Please find the selected lot within the provided image. The selected lot is contained by a thin bright blue line. It also has a central mark with the white letters "id" on a black background followed by a red period. After confirming the boundaries of the selected lot, can you estimate how much of the selected lot is covered by water or in a flood zone? You can use the legend on the left of the image to see some of the colors of areas of ground water or flood zone. Please be aware that flood zones or surface water usually have curvilinear or rounded borders, and have some blue, or blue/green, but are not totally green in color. These are noted to have a thin black line as a border of the same thickness as the bright blue boundary of the selected lot. In the response, please return the following: the full reasoning text ,followed by 2 empty newlines, followed by string ----------- , followed by 2 newlines, followed by a json template that looks like: {"estimated percentage flood zone": <integer only>, "estimated percentage ground water": <integer only>, "total estimated percentage": <integer only>}"; make sure its valid JSON';

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
    if (obj.WaterURL && ["", "{}"].includes(obj.RoadResponse)) {
      waterFile = obj.WaterURL;
      console.log("Water File: " + waterFile);
      promises.push(openRouterApiRequest(waterFile, waterText));
      obj.WaterResponse = "PENDING";
      myObjs.push(obj);
    }
    if (obj.ContourURL && ["", "{}"].includes(obj.ContourResponse)) {
      contourFile = obj.ContourURL;
      console.log("Contour File: " + contourFile);
      promises.push(openRouterApiRequest(contourFile, contourText));
      obj.ContourResponse = "PENDING";
      myObjs.push(obj);
    }
    if (obj.ContourURL && ["", "{}"].includes(obj.RoadResponse)) {
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
