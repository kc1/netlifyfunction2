require("dotenv").config();
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;

async function fetchMongoDBData(filterObj, coll, limit = 1000, skip = 0) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const database = client.db("mydata");
    const collection = database.collection(coll);
    
    // Add limit and skip for pagination to prevent large responses
    const documents = await collection
      .find(filterObj)
      .sort({ list_date: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
    
    // Get total count for pagination info
    const totalCount = await collection.countDocuments(filterObj);
    
    return { 
      documents, 
      totalCount,
      limit,
      skip,
      hasMore: (skip + documents.length) < totalCount
    };
  } catch (error) {
    throw new Error(`MongoDB error: ${error.message}`);
  } finally {
    await client.close();
  }
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}");
    
    // Extract parameters from request
    const filterObj = body.filterObj;
    const coll = body.coll;
    const limit = body.limit || 1000; // Default limit of 1000 documents
    const skip = body.skip || 0; // Default skip of 0
    
    console.log("Filter object:", filterObj);
    console.log("Collection name:", coll);
    console.log("Limit:", limit, "Skip:", skip);

    if (!filterObj || !coll) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Missing filterObj or coll parameter" }) 
      };
    }

    // Validate limit to prevent extremely large requests
    if (limit > 5000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Limit cannot exceed 5000 documents" })
      };
    }

    const result = await fetchMongoDBData(filterObj, coll, limit, skip);
    
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