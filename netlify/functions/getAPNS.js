require("dotenv").config();
const { MongoClient } = require("mongodb");
var murl = process.env.MONGODB_URI;
console.log(murl);
const client = new MongoClient(murl);
client.connect();
const database = client.db("mydata");
let collection = database.collection("token1");

// const parcelFact = require("./ParcelFact");

async function getOneElementFromCollection() {
  try {
    const document = await collection.findOne({});
    return document;
  } catch (error) {
    console.error("Error fetching document from MongoDB:", error);
    return null;
  }
}

async function resetCollection(authToken) {
  try {
    // Drop the collection if it exists
    await collection.drop();

    // Insert a single document with authToken and timestamp
    const document = {
      authToken: authToken,
      timestamp: new Date(),
    };
    await collection.insertOne(document);
    console.log("Collection reset and document inserted:", document);
  } catch (error) {
    console.error("Error resetting collection:", error);
  }
}

async function test3(lat, lon, AuthToken) {
  // "https://api-prod.corelogic.com/spatial-tile/parcels/SpatialRecordUTPremium?lat=33.80045582382531&lon=-84.48427394094072&pageNumber=1&pageSize=4&access_token=Ehln39JeHKoMtduVvnzZVoMZgtwV",
  const myUrl = `https://api-prod.corelogic.com/spatial-tile/parcels/SpatialRecordUTPremium?lat=${lat}&lon=${lon}&pageNumber=1&pageSize=4&access_token=${AuthToken}`;

  r = await fetch(myUrl, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      Referer: "https://parcelfact.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: null,
    method: "GET",
  });

  const data = await r.json(); //assuming data is json
  return data;
  // console.log(data);
}
async function auth2() {
  const r = await fetch(
    "https://parcelfact.com/wp-content/plugins/parcel-facts-plugin/parcels/",
    {
      headers: {
        Referer:
          "https://parcelfact.com/wp-content/plugins/parcel-facts-plugin/map/index.html",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const data = await r.json(); //assuming data is json
  // console.log(data);
  return data;
}

async function login3() {
  resp = await fetch("https://parcelfact.com/land/", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie:
        "pmpro_visit=1; _ga=GA1.1.1944047942.1699795020; __stripe_mid=86e6036d-e233-4ed3-822d-54b0a7d7bbf7660855; _hjSessionUser_3273888=eyJpZCI6IjMyOGU3MmJjLTdlMTUtNTc5OS1iNzBlLTQ5N2NlMGExMDcxYSIsImNyZWF0ZWQiOjE2OTk3OTUwMjA1ODAsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_test_cookie=WP%20Cookie%20check; _hjIncludedInSessionSample_3273888=0; _hjSession_3273888=eyJpZCI6IjBkN2JiOGEyLWY5OWMtNDdkMy05M2FhLWFkY2UyNmE3MjkwMCIsImNyZWF0ZWQiOjE3MDAwMTMzNDUxNzgsImluU2FtcGxlIjpmYWxzZSwic2Vzc2lvbml6ZXJCZXRhRW5hYmxlZCI6dHJ1ZX0=; __stripe_sid=7347b5dc-c575-4e14-ba27-a38d040b7dcd48a3ec; wp_lang=en_US; _ga_WF9E6E6TRJ=GS1.1.1700013344.7.1.1700017236.0.0.0",
      Referer: "https://parcelfact.com/member-area/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: "pmpro_login_form_used=1&log=optionhomes11%40gmail.com&pwd=8MIS9SY3H%286ymrOhGJ2Vbd%212&wp-submit=Log+In&redirect_to=",
    method: "POST",
  });
}
async function getOneAPN(lat, lon) {
  let authKey;
  const now = new Date();
  const element = await getOneElementFromCollection();
  console.log("element ", element);
  console.log(now);
  console.log(element?.timestamp);
  console.log(now - element?.timestamp);

  if (
    element?.authToken?.length > 0 &&
    element?.timestamp &&
    now - element.timestamp < 1000 * 60 * 60
  ) {
    authKey = element.authToken;
  } else {
    const o = await login3();
    const token = await auth2();
    console.log("token ", token);
    authKey = token.authKey;
    console.log("authKey ", authKey);
    const response = await resetCollection(authKey);
  }

  if (lat && lon) {
    // const obj = await test3(lat, lon, token.authKey);
    let obj = await test3(lat, lon, authKey);
    if (obj.parcels && obj.parcels.length > 0) {
      obj.parcels[0].authKey = authKey;
    }
    return obj.parcels[0];
  } else {
    return "coordinate missing";
  }
}

exports.handler = async function (event, context) {
  const body = JSON.parse(event.body); // postencoded
  // const body = event.body
  // const apn = '110067270';
  const lat = body.lat;
  const lon = body.lon;
  console.log("starting ", body);
  console.log("lat ", lat);
  console.log("lon ", lon);

  //
  //   const lat = req.query.lat;
  //   const lon = req.query.lon;
  // const response = await parcelFact.getOneAPN(lat, lon);
  const response = await getOneAPN(lat, lon);
  console.log(response);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: response,
    }),
  };
};
