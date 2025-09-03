const fetch = require("node-fetch");

function geoQuery(lon, lat, radius, minAcreage, maxAcreage, daysBack = 183) {
  const metersinmile = 1609.34;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return {
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
        $maxDistance: radius * metersinmile,
      },
    },
    "location.coordinates": { $type: "array", $size: 2 },
    "location.coordinates.0": { $type: "number", $ne: null },
    "location.coordinates.1": { $type: "number", $ne: null },
    lot_acres: { $gte: minAcreage, $lte: maxAcreage },
    sold_date: { $gte: cutoffDate.toISOString() },
  };
}

async function fetchMongoDBDataAPI(filterObj, coll) {
  const url =
    "https://us-east-1.aws.data.mongodb-api.com/app/data-wygci/endpoint/data/v1/action/find";
  const apiKey = process.env.MONGODB_API_KEY; // Use .env for secrets
  const headers = {
    "Content-Type": "application/json",
    "api-key": apiKey,
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
    headers,
    body: JSON.stringify(payload),
  });
  return response.json();
}

function cosineDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
  // Implement your distance calculation here
  // For now, just return 0
  return 0;
}


async function createSubdivideQueryArray(myRow) {

  const metersinmile = 1609.34;
  const lon = Number(myRow.lon);
  const lat = Number(myRow.lat);
  let queryArray = [];
  for (let i = 2; i <= 5; i++) {
    let pieceSize = myRow.lot_acres / i;
    let minAcreage = pieceSize * 0.75;
    let maxAcreage = pieceSize * 1.25;
    let radius = 30 * metersinmile; // 30 miles
    queryArray.push(
      geoQuery(lon, lat, radius, minAcreage, maxAcreage)
    );
  }
  return queryArray;
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    const myRow = body.rowObj;
    const coll = body.coll || "wisconsinSold";

    if (!myRow.lon || !myRow.lat) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing lat/long in index property." }),
      };
    }

    let myQueryArray = await createSubdivideQueryArray(myRow);
    for (let i = 0; i < myQueryArray.length; i++) {
      const myQuery = myQueryArray[i];
      const myObjects = await fetchMongoDBDataAPI(myQuery, coll);
      console.log(myObjects);
    }

    const propertyResults = myObjects.documents || [];
    let totalPPA = 0;
    let processedResults = [];

    for (let property of propertyResults) {
      const distance = cosineDistanceBetweenPoints(
        Number(myRow.lat),
        Number(myRow.lon),
        Number(property.coordinate?.lat),
        Number(property.coordinate?.lon)
      );
      property.DISTANCE = distance / 1609.34;
      processedResults.push(addRowFromObject(property));
      totalPPA += property.ppa || 0;
    }

    const avgPPA = propertyResults.length
      ? totalPPA / propertyResults.length
      : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        avgPPA,
        properties: processedResults,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};
