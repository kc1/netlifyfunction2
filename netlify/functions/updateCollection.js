require("dotenv").config();
const { MongoClient } = require("mongodb");
var murl = process.env.MONGODB_URI;
// var murl = "mongodb://localhost:27017/";
const client = new MongoClient(murl);
client.connect();
const database = client.db("mydata");

// let collection = database.collection("bucket1");
let firstNum = 0;
let lastNum = 3;
let myArgs = process.argv.slice(2);
console.log(myArgs);

async function upsertToBucket(coll, objArr) {

  for (let i = 0; i < objArr.length; i++) {
    let obj = objArr[i];
    // Use listing_id as the unique identifier in the filter.
    obj = await addFields(obj);
    console.log("obj: ", obj);
    const filter = { listing_id: obj.listing_id };
    try {
      const result = await coll.updateOne(
        filter,
        { $set: obj },
        { upsert: true }
      );
      console.log("result: ", result);
      if (result.upsertedCount > 0) {
        console.log(
          `Upsert created a new listing with id: ${result.upsertedId._id}`
        );
      } else if (result.modifiedCount > 0) {
        console.log(`Updated listing with listing_id: ${obj.listing_id}`);
      } else {
        console.log(`No changes made for listing_id: ${obj.listing_id}`);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function createUniqueIndexForListingId(coll) {
  try {
    const indexName = await coll.createIndex(
      { listing_id: 1 },
      { unique: true }
    );
    console.log(`Unique index created with name: ${indexName}`);
    return indexName;
  } catch (error) {
    console.error("Error creating unique index for listing_id:", error);
    throw error;
  }
}

//headers for CORS
const headers = {
  "Cache-Control": "no-cache",
  "Cross-Origin-Opener-Policy": "unsafe-none",
  "Cross-Origin-Embedder-Policy": "unsafe-none",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Private-Network": "true",
  "Access-Control-Allow-Headers":
    "Content-Type, Access-Control-Request-Private-Network",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,HEAD,QUERY,query",
};

async function addFields(obj) {
  // Extract fields that might already exist, or default them to null.
  const InitialEvaluation = obj.InitialEvaluation || null;
  const list_date = obj.list_date || null;

  // Build the AAlink if the permalink is available.
  const AAlink = obj.permalink
    ? `https://www.realtor.com/realestateandhomes-detail/${obj.permalink}?from=srp`
    : null;

  // Process flags: join keys with truthy values.
  let flags = null;
  if (obj.flags) {
    const flagKeys = Object.keys(obj.flags);
    flags = flagKeys.filter(key => obj.flags[key]).join(",");
  }

  // Initialize lat and lon to null.
  let lat = null, lon = null;
  // Extract coordinates (lat, lon) from the nested object if available.
  if (
    obj.location &&
    obj.location.address &&
    obj.location.address.coordinate &&
    typeof obj.location.address.coordinate.lat === "number" &&
    typeof obj.location.address.coordinate.lon === "number"
  ) {
    // Assign to our variables.
    lat = obj.location.address.coordinate.lat;
    lon = obj.location.address.coordinate.lon;
    // Optionally, you might set a point on the original location
    obj.location.point = {
      type: "Point",
      coordinates: [lon, lat] // Note: this is typical GeoJSON order (lon, lat)
    };
  }

  // Extract address and state from location.address.
  const address =
    obj.location && obj.location.address ? obj.location.address.line : null;
  const state =
    obj.location && obj.location.address ? obj.location.address.state : null;

  // Extract county from obj.location.county.
  const county =
    obj.location && obj.location.county ? obj.location.county.name : null;

  // Compute lot_acres from description.lot_sqft if available.
  const lot_sqft =
    obj.description && obj.description.lot_sqft
      ? obj.description.lot_sqft
      : null;
  const lot_acres = lot_sqft ? lot_sqft / 43560 : null;

  // Add price from list_price.
  const price = obj.list_price || null;

  // Calculate price per acre (ppa) if lot_acres and price are available.
  const ppa = (price && lot_acres && lot_acres > 0)
    ? price / lot_acres
    : null;

  // Set updatedAt to the current date.
  const updatedAt = new Date();

  // Extract agent details from the advertisers array (using the first advertiser).
  const AgentName =
    obj.advertisers &&
    obj.advertisers.length > 0 &&
    obj.advertisers[0].name
      ? obj.advertisers[0].name
      : null;
  const AgentEmail =
    obj.advertisers &&
    obj.advertisers.length > 0 &&
    obj.advertisers[0].email
      ? obj.advertisers[0].email
      : null;
  const AgentPhone =
    obj.advertisers &&
    obj.advertisers.length > 0 &&
    obj.advertisers[0].phones &&
    obj.advertisers[0].phones.length > 0
      ? obj.advertisers[0].phones[0].number
      : null;

  // Build the new object with merged fields.
  let newObj = {
    ...obj,
    InitialEvaluation,
    list_date,
    AAlink,
    flags,
    lat,
    lon,
    address,
    state,
    county,
    lot_acres,
    price,
    ppa,
    updatedAt,
    AgentName,
    AgentEmail,
    AgentPhone,
  };

  // Delete the original location property.
  delete newObj.location;

  // Create a new location property with type 'Point'
  // and coordinates array with index 0 = lon and index 1 = lat.
  newObj.location = {
    type: "Point",
    coordinates: [lon, lat] 
  };

  return newObj;
}

async function ateFirstPageFlags(myURL, state) {
  const html = await getHTMLWithScrapingant2(myURL);
  if (!html) {
    console.log("no html in scrapefirstpage -- blocked?");
    return;
  }
  const objArr = await parsePage(html);
  // let counter = 0;

  // here you have to update each object one at a time
  // Filter criteria to find the document
  for (let i = 0; i < objArr.length; i++) {
    let obj = objArr[i];
    // obj["state"] = state;
    obj["updatedAt"] = new Date();
    // console.log("current obj: ", obj);
  }
  return objArr;
}

exports.handler = async function (event, context) {
  console.log("context: ", context);
  console.log("event: ", event);

  if (event.httpMethod !== "OPTIONS" && event.httpMethod !== "POST") {
    console.log("event.httpMethod: ", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  } else if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: headers,
      body: null,
    };
  }

  if (event.httpMethod === "POST") {
    console.log("event.httpMethod: ", event.httpMethod);
    console.log("event.body: ", event.body);
    const data = JSON.parse(event.body);
    console.log("data: ", data);
    const collName = data.dbName;
    let collection = database.collection(collName);

    // Call the function to ensure a unique index on "listing_id" is created
    await createUniqueIndexForListingId(collection);

    const savedArray = data.savedArray;
    await upsertToBucket(collection, savedArray);

    return {
      statusCode: 204,
      headers: headers,
      body: JSON.stringify({
        message: "Data received successfully",
      }),
    };
  }
};
