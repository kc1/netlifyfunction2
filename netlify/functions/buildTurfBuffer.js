let firstNum = 0;
let lastNum = 3;
let myArgs = process.argv.slice(2);
console.log(myArgs);
const buffer = require("@turf/buffer").default; // Note: may need .default depending on version
// OR
// const buffer = require('@turf/buffer');

exports.handler = async function (event, context) {
  
  // Parse the request body as an object
  const myObjArray = JSON.parse(event.body);
  // const myObjArray = requestData.data; // The array of objects
  // const collectionName = requestData.collectionName; // The collection name
  // let collection = database.collection(collectionName);

  console.log("Received data:", myObjArray);
  // console.log("Received collection name:", collectionName);
  

  // // Logger.log(geojson_data);
  var buffered = turf.buffer(geojson_data, 100 * 0.000189394, "miles");
  // var buffered = turf.buffer(geojson_data, 100, {units: 'feet'});
  const geoJsonObj = buffered.geometry;
  // const newGeoJsonObj = normalizeGeoJSONForGeojsonIO(geoJsonObj);
  // const newGeojsonString = JSON.stringify(newGeoJsonObj)
  // Logger.log(newGeojsonString);

  // const encoded = encodeURIComponent(newGeojsonString);
  // const encoded = encodeURIComponent(newGeoJson);
  const encoded = encodeURIComponent(JSON.stringify(geoJsonObj));
  // Logger.log(encoded);

  const longUrl = `http://geojson.io/#data=data:application/json,${encoded}`;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: longUrl,
    }),
  };
};
