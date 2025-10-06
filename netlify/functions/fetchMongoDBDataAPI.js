require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;

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

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    
    // Extract filter object and collection name from request
    const filterObj = body.filterObj;
    const coll = body.coll;
    
    console.log("Filter object:", filterObj);
    console.log("Collection name:", coll);

    if (!filterObj || !coll) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Missing filterObj or coll parameter" }) 
      };
    }

    const result = await fetchMongoDBData(filterObj, coll);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};