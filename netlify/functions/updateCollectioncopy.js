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
    const obj = objArr[i];
    // Use listing_id as the unique identifier in the filter.
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
    const indexName = await coll.createIndex({ listing_id: 1 }, { unique: true });
    console.log(`Unique index created with name: ${indexName}`);
    return indexName;
  } catch (error) {
    console.error("Error creating unique index for listing_id:", error);
    throw error;
  }
}

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

async function parsePage(jsonInString) {
  const myJson = await JSON.parse(jsonInString);
  const propArr = myJson.props.pageProps.properties;
  console.log(propArr[0]);
  let coordinates = [];
  if (propArr) {
    for (let i = 0; i < propArr.length; i++) {
      const property = propArr[i];
      const flagObj = property.flags;
      const flagKeys = Object.keys(flagObj);
      let myflags = [];
      for (let i = 0; i < flagKeys.length; i++) {
        const flagkey = flagKeys[i];
        if (flagObj[flagkey]) {
          myflags.push(flagkey);
        }
      }
      // const lot_sqft = property?.description?.lot_sqft;
      // const lot_acres = lot_sqft / 43560;
      // const ppa = property.list_price / lot_acres;
      // const county = property?.location?.county?.name;
      // const address = property?.location?.address?.line;
      // // const myLink = 'https://www.realtor.com/realestateandhomes-detail/' + property.permalink + "?from=srp-list-card";
      // const myLink =
      //   "https://www.realtor.com/realestateandhomes-detail/" +
      //   property.permalink +
      //   "?from=srp";
      coordinates.push({
        // lot_acres: lot_acres,
        // ppa: ppa,
        id: i,
        listing_id: property.listing_id,
        // coordinate: property.location.address.coordinate,
        // price: property.list_price,
        // list_date: property.list_date,
        // AAlink: myLink,
        flags: myflags.join(","),
        // address: address,
        // county: county,
        // lot_sqft: lot_sqft,
      });
    }
  }
  return coordinates;
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
