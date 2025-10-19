require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "mydata";

async function upsertToBucket(collection, objArr) {
  if (!Array.isArray(objArr)) throw new Error("objArr must be an array");
  const results = [];
  for (const obj of objArr) {
    const filter = { listing_id: obj.listing_id };
    try {
      const res = await collection.updateOne(filter, { $set: obj }, { upsert: true });
      results.push({ listing_id: obj.listing_id, upsertedCount: res.upsertedCount || 0, modifiedCount: res.modifiedCount || 0 });
    } catch (err) {
      results.push({ listing_id: obj.listing_id, error: err.toString() });
    }
  }
  return results;
}

exports.handler = async function (event, context) {
  // validate input
  let bodyObj;
  try {
    bodyObj = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const collName = bodyObj.coll || "AgentsContacted";
  const myObjArray = Array.isArray(bodyObj.myObjArray) ? bodyObj.myObjArray : [];
  if (myObjArray.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "myObjArray must be a non-empty array" }) };
  }

  if (!MONGO_URI) return { statusCode: 500, body: JSON.stringify({ error: "Missing MONGODB_URI in environment" }) };

  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(collName);

    const results = await upsertToBucket(collection, myObjArray);

    return { statusCode: 200, body: JSON.stringify({ message: "Upsert complete", results }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.toString() }) };
  } finally {
    try { await client.close(); } catch (e) { /* ignore */ }
  }
};
