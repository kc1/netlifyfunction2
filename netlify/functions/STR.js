require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;

function buildQuery(minAcreage, maxAcreage, county) {
  return {
    lot_acres: { $gte: minAcreage, $lte: maxAcreage },
    county: county,
  };
}

async function fetchMongoDBData(filterObj, coll) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const database = client.db("mydata");
    const collection = database.collection(coll);
    
    const documents = await collection
      .find(filterObj)
      .sort({ list_date: -1 })
      .toArray();
    
    return { documents };
  } catch (error) {
    throw new Error(`MongoDB error: ${error.message}`);
  } finally {
    await client.close();
  }
}

async function fetchColumnData(key, county, forSaleCollectionName, soldCollectionName) {
  const keyring = key.split("--");
  const filterValues = {
    min: Number(keyring[0]),
    max: Number(keyring[1]),
    status: keyring[2],
  };

  const collName = filterValues.status === "FS" ? forSaleCollectionName : soldCollectionName;

  const filterObj = buildQuery(filterValues.min, filterValues.max, county.trim());
  const result = await fetchMongoDBData(filterObj, collName);
  return result; // already a plain object
}

async function updateRows(forSaleCollName, soldCollName, selectedRows) {
  const updatedRows = [];
  for (const myRow of selectedRows) {
    for (const [key] of Object.entries(myRow)) {
      if (key.includes("FS") || key.includes("SOLD")) {
        try {
          const myObjects = await fetchColumnData(key, myRow.COUNTY, forSaleCollName, soldCollName);
          const count = (myObjects && myObjects.documents) ? myObjects.documents.length : 0;
          myRow[key] = count;
        } catch (e) {
          console.error("Error fetching column data", e);
          myRow[key] = 0;
        }
      }
    }
    updatedRows.push(myRow);
  }
  return updatedRows;
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    console.log("body: ", body);
    const soldColl = body.payload.soldColl;
    const fsColl = body.payload.fsColl;
    const rows = body.payload.rows || [];

    if (!soldColl || !fsColl) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing collection names" }) };
    }

    const updatedRows = await updateRows(fsColl, soldColl, rows);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: updatedRows }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};
