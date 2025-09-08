const { json } = require("express");
const fetch = require("node-fetch");

function geoQuery(lon, lat, myRadiusInMiles, minAcreage, maxAcreage, daysBack) {
  const metersinmile = 1609.34;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return {
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
        $maxDistance: myRadiusInMiles * metersinmile,
      },
    },
    "location.coordinates": { $type: "array", $size: 2 },
    "location.coordinates.0": { $type: "number", $ne: null },
    "location.coordinates.1": { $type: "number", $ne: null },
    lot_acres: { $gte: minAcreage, $lte: maxAcreage },
    sold_date: { $gte: cutoffDate.toISOString() },
  };
}

async function fetchMongoDBData(filterObj, coll) {
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
  return result;
}

async function getSoldPPA(properties) {
  let avgSoldPPA = 0;
  if (properties.length > 0) {
    let totalSoldPPA = 0;
    for (var i = 0; i < properties.length; i++) {
      let property = properties[i];
      property.soldPPA = property.sold_price / property.lot_acres;
      totalSoldPPA = totalSoldPPA + property.soldPPA;
      console.log(property.soldPPA);
    }

    avgSoldPPA = totalSoldPPA / properties.length;
    // console.log("avgSoldPPA inside getSoldPPA");
    // console.log(avgSoldPPA);
  }
  console.log("Final avgSoldPPA inside getSoldPPA");
  console.log(avgSoldPPA);

  return avgSoldPPA;
}

async function testSubdivideQueryArray(myRow, daysBack, myRadius) {

  // const metersinmile = 1609.34;
  const lon = Number(myRow.lon);
  const lat = Number(myRow.lat);
  let queryArray = [];
  let pieceSize = myRow.lot_acres / myRow.PIECES;
  console.log("pieceSize:", pieceSize);
  let minAcreage = pieceSize * 0.75;
  let maxAcreage = pieceSize * 1.25;
  let radius = myRadius * metersinmile; // 30 miles
  const myQuery = geoQuery(lon, lat, radius, minAcreage, maxAcreage, daysBack);
  console.log(JSON.stringify(myQuery));
  queryArray.push(myQuery);

  return queryArray;
}

async function createSubdivideQueryArray(myRow, daysBack, myRadiusInMiles) {

  const lon = Number(myRow.lon);
  const lat = Number(myRow.lat);
  let queryArray = [];
  for (let i = 2; i <= 5; i++) {
    let pieceSize = myRow.lot_acres / i;
    console.log("pieceSize:", pieceSize);
    let minAcreage = pieceSize * 0.75;
    let maxAcreage = pieceSize * 1.25;
    // let radius = myRadiusInMiles; // 30 miles
    const myQuery = geoQuery(
      lon,
      lat,
      myRadiusInMiles,
      minAcreage,
      maxAcreage,
      daysBack
    );
    console.log(JSON.stringify(myQuery));
    queryArray.push(myQuery);
  }
  return queryArray;
}

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body);
    const coll = body.coll || "wisconsinSold3";
    const daysBack = body.daysBack || 400;
    const myRadiusInMiles = body.radius || 30;
    let myRow = body.rowObj;
    myRow.SOLD_PPA_AVG = 0;
    console.log("myRow input", myRow);

    if (!myRow.lon || !myRow.lat) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing lat/long in index property." }),
      };
    }

    // geoQuery(lon, lat, radius, minAcreage, maxAcreage, daysBack = 600)

    let myQueryArray = await createSubdivideQueryArray(myRow, daysBack, myRadiusInMiles);
    let savedQuery ;
    // console.log("myQueryArray", JSON.stringify(myQueryArray));
    for (let i = 0; i < myQueryArray.length; i++) {
      const myQuery = myQueryArray[i];
      console.log("myQUERY", JSON.stringify(myQuery));
      const myObjects = await fetchMongoDBData(myQuery, coll);
      console.log(
        "Fetched",
        myObjects.documents.length,
        "records from " + coll
      );
      // console.log(myObjects);

      // loop through and get sold PPA for this acreage range
      //
      const avgSoldPPA = await getSoldPPA(myObjects.documents);
      // console.log("myRow:", myRow);
      if (avgSoldPPA > myRow.SOLD_PPA_AVG || myRow.SOLD_PPA_AVG === 0) {
        myRow.SOLD_PPA_AVG = Math.round(avgSoldPPA);
        myRow.MIN_ACRES = myQuery.lot_acres.$gte;
        myRow.MAX_ACRES = myQuery.lot_acres.$lte;
        myRow.PIECES = i + 2;
        myRow["ACRES/PIECE"] = myRow.lot_acres / myRow.PIECES;
        savedQuery = myQuery;
        console.log("Updated myRow:");
      } else {
        console.log("No Update myRow:");
      }
      console.log("myQUERY", JSON.stringify(myQuery));
      console.log("myRow", myRow);
      console.log("avgSoldPPA", avgSoldPPA);
    }

    console.log("final myRow", myRow);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Updated SOLD_PPA_AVG",
        rowObj: myRow,
        savedQuery: savedQuery,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};
