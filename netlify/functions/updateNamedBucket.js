require("dotenv").config();
const { MongoClient } = require("mongodb");
var murl = process.env.MONGODB_URI;
const client = new MongoClient(murl);
client.connect();
const database = client.db("mydata");
let firstNum = 0;
let lastNum = 3;
let myArgs = process.argv.slice(2);
console.log(myArgs);

async function upsertToBucket(coll, objArr) {
  for (let i = 0; i < objArr.length; i++) {
    const obj = objArr[i];
    // Use ID as the unique identifier in the filter.
    const filter = { ID: obj.ID };
    try {
      const result = await coll.updateOne(
        filter,
        { $set: obj },
        { upsert: true },
      );
      if (result.upsertedCount > 0) {
        console.log(
          `Upsert created a new listing with id: ${result.upsertedId.ID}`,
        );
      } else if (result.modifiedCount > 0) {
        console.log(`Updated listing with ID: ${obj.ID}`);
      } else {
        console.log(`No changes made for ID: ${obj.ID}`);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function createUniqueIndexForId(coll) {
  try {
    // Get existing indexes
    const indexes = await coll.indexes();
    // Check if unique index on ID exists
    const indexExists = indexes.some(index => index.key.ID === 1 && index.unique === true);
    if (indexExists) {
      console.log("Unique index on ID already exists");
      return;
    }
    // Create the index
    const indexName = await coll.createIndex({ ID: 1 }, { unique: true });
    console.log(`Unique index created with name: ${indexName}`);
    return indexName;
  } catch (error) {
    console.error("Error creating unique index for ID:", error);
    throw error;
  }
}

exports.handler = async function (event, context) {
  // console.log("context: ", context);
  // console.log("event: ", event);

  // Parse the request body as an object
  const requestData = JSON.parse(event.body);
  const myObjArray = requestData.data; // The array of objects
  const collectionName = requestData.collectionName; // The collection name
  let collection = database.collection(collectionName);

  console.log("Received data:", myObjArray);
  console.log("Received collection name:", collectionName);

  // Call the function to ensure a unique index on "listing_id" is created
  await createUniqueIndexForId(collection);

  await upsertToBucket(collection, myObjArray);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: myObjArray,
    }),
  };
};
