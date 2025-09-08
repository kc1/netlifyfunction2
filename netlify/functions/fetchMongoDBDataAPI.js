const fetch = require("node-fetch");


exports.handler = async function fetchMongoDBData(event) {
  // async function fetchMongoDBData(filterObj, coll) {
  const body = JSON.parse(event.body);
    
  
  // If the body is a string (which might happen in some cases), you'd need to parse it:
  // const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  
  // Now you can access the data from your request
  const filterObj = body.filterObj;
  const coll = body.coll;
  
  console.log("Filter object:", filterObj);
  console.log("Collection name:", coll);;

  const url =
    "https://us-east-1.aws.data.mongodb-api.com/app/data-wygci/endpoint/data/v1/action/find";
  const apiKey =
    "1GxuC9AAuc77xJklnS1PSHVKhZUt3QkcOaqdSYRqoeQVrSnf8jtGtLO3zGlNfm4T";
  const authToken =
    "1GxuC9AAuc77xJklnS1PSHVKhZUt3QkcOaqdSYRqoeQVrSnf8jtGtLO3zGlNfm4T";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Request-Headers": "*",
    "api-key": apiKey,
    Authorization: authToken,
  };
  const payload = {
    collection: coll,
    database: "mydata",
    dataSource: "Cluster0",
    filter: filterObj,
    projection: {},
    sort: { list_date: -1 },
  };
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  //   return { response, result };
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};