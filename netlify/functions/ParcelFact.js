// const myHelpers = require("./helpers");
// const randSleep = myHelpers.randomSleep;
const storage = require("node-persist");
storage.init();
var fetch = require("node-fetch");

// const { MongoClient } = require("mongodb");
// var murl = "mongodb://localhost:27017/local";
// const client = new MongoClient(murl);
// client.connect();
// const database = client.db("mydata");
// // const collection = database.collection("realtortest3");
// const collection = database.collection("alabama1");
// let firstNum = 10;
// // let lastNum = 2;
// let myArgs = process.argv.slice(2);
// console.log(myArgs);
// if (myArgs && myArgs[0] && parseInt(myArgs[0]) != NaN) {
//   console.log(myArgs);
//   firstNum = parseInt(myArgs[0]);
//   // lastNum = parseInt(myArgs[1]);
// }
// console.log(firstNum);

// if you just grab the authkey - it should work -- it does in postman

var qs = require("qs");
// // import qs from 'qs'
var axios = require("axios");
const { json } = require("express");
function createAxios() {
  const axios = require("axios");
  return axios.create({ withCredentials: true });
}
const axiosInstance = createAxios();

// // 2. Make sure you save the cookie after login.
// // I'm using an object so that the reference to the cookie is always the same.
const cookieJar = {
  myCookies: undefined,
};

async function getSiteCookies() {
  // 'cookie': 'pmpro_visit=1; __stripe_mid=6badd0fb-4841-4f1e-94ed-f39ece2a695c76d9a5; wordpress_test_cookie=WP%20Cookie%20check; wp_lang=en_US; _ga=GA1.1.185260876.1680313561; _hjSessionUser_3273888=eyJpZCI6ImQ4MjFjZjQ2LTNlNmYtNTg0Ni1hMjgwLTRhMTE3YjJiNjM2ZiIsImNyZWF0ZWQiOjE2ODAzMTM1NjI4NTYsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_logged_in_e9fe2dd1c66bb26aa18f86ec7d187628=dn%7C1680548363%7CMHBiMue5Rj028FziR55cjYP5hdn9gmatyEpFZ4BPyIq%7C52de9941128ae5a71fe82625238c7716bb4be5e621db7eaf6b18e608eacc25f6; _ga_WF9E6E6TRJ=GS1.1.1680436217.5.0.1680436217.0.0.0',
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://parcelfact.com/member-area/",
    headers: {
      authority: "parcelfact.com",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      dnt: "1",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    },
  };
  try {
    const response = await axiosInstance(config);
    // console.log(JSON.stringify(response.data));
    console.log(JSON.stringify(response.headers));
    cookieJar.myCookies = response.headers["set-cookie"];
    return cookieJar;
  } catch (error) {
    console.log(error);
  }
}

async function login2() {
  const x = await fetch("https://parcelfact.com/land/", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie:
        "pmpro_visit=1; _ga=GA1.1.1944047942.1699795020; __stripe_mid=86e6036d-e233-4ed3-822d-54b0a7d7bbf7660855; _hjSessionUser_3273888=eyJpZCI6IjMyOGU3MmJjLTdlMTUtNTc5OS1iNzBlLTQ5N2NlMGExMDcxYSIsImNyZWF0ZWQiOjE2OTk3OTUwMjA1ODAsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_test_cookie=WP%20Cookie%20check; _hjIncludedInSessionSample_3273888=0; _hjSession_3273888=eyJpZCI6ImEyMjhlNDQ3LTRhZGUtNDIzNi1hNjVkLWY3ODRiMDFmYjA4YiIsImNyZWF0ZWQiOjE2OTk4MDI5NjU1MDIsImluU2FtcGxlIjpmYWxzZSwic2Vzc2lvbml6ZXJCZXRhRW5hYmxlZCI6dHJ1ZX0=; __stripe_sid=3be5c086-193d-4370-b5ce-866bd3c78a22629343; _ga_WF9E6E6TRJ=GS1.1.1699802965.2.1.1699803007.0.0.0",
      Referer: "https://parcelfact.com/member-area/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: "pmpro_login_form_used=1&log=optionhomes11%40gmail.com&pwd=8MIS9SY3H%286ymrOhGJ2Vbd%212&wp-submit=Log+In&redirect_to=",
    method: "POST",
  });
  return x;
}

// async function login() {
//   // this gives an error but so far I can still get token with the Auth function.

//   var data = await qs.stringify({
//     pmpro_login_form_used: "1",
//     log: "optionhomes11@gmail.com",
//     pwd: "8MIS9SY3H(6ymrOhGJ2Vbd!2",
//     "wp-submit": "Log+In",
//     redirect_to: "",
//   });
//   var config = {
//     method: "post",
//     url: "https://parcelfact.com/wp-login.php",
//     headers: {
//       authority: "parcelfact.com",
//       accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
//       "accept-language": "en-US,en;q=0.9",
//       "cache-control": "max-age=0",
//       "content-type": "application/x-www-form-urlencoded",
//       cookie:
//         "pmpro_visit=1; _ga=GA1.1.1944047942.1699795020; __stripe_mid=86e6036d-e233-4ed3-822d-54b0a7d7bbf7660855; _hjSessionUser_3273888=eyJpZCI6IjMyOGU3MmJjLTdlMTUtNTc5OS1iNzBlLTQ5N2NlMGExMDcxYSIsImNyZWF0ZWQiOjE2OTk3OTUwMjA1ODAsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_test_cookie=WP%20Cookie%20check; _hjIncludedInSessionSample_3273888=0; _hjSession_3273888=eyJpZCI6ImEyMjhlNDQ3LTRhZGUtNDIzNi1hNjVkLWY3ODRiMDFmYjA4YiIsImNyZWF0ZWQiOjE2OTk4MDI5NjU1MDIsImluU2FtcGxlIjpmYWxzZSwic2Vzc2lvbml6ZXJCZXRhRW5hYmxlZCI6dHJ1ZX0=; __stripe_sid=3be5c086-193d-4370-b5ce-866bd3c78a22629343; _ga_WF9E6E6TRJ=GS1.1.1699802965.2.1.1699803007.0.0.0",

//       // cookie:
//       // "pmpro_visit=1; _ga=GA1.1.196083285.1680379272; __stripe_mid=30454eb1-68ce-4fbc-bb1e-588cd3e3dc1981897e; _hjSessionUser_3273888=eyJpZCI6ImI4MGVjNTc0LTUxOGEtNWY4NS1hNmZiLTk2NmQzYThjZTFmYyIsImNyZWF0ZWQiOjE2ODAzNzkyNzI2NTEsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_test_cookie=WP%20Cookie%20check; _hjIncludedInSessionSample_3273888=0; _hjSession_3273888=eyJpZCI6IjkyMGI5Yjc2LTY1Y2EtNGYzZS1hNmU3LTQyOTVlZWEyMzUwZiIsImNyZWF0ZWQiOjE2ODAzODc2NDQxODEsImluU2FtcGxlIjpmYWxzZX0=; __stripe_sid=6cb6a2ea-ea9e-45f8-b753-c434800aa05f7f2255; _ga_WF9E6E6TRJ=GS1.1.1680387557.3.1.1680388168.0.0.0; wordpress_logged_in_e9fe2dd1c66bb26aa18f86ec7d187628=dn%7C1680560970%7CYZNhGg93OdxC8jNPpR0FibYuwqFxgPqUChckfZYVyIA%7C76ae9058b28b8573870e7155a7713217497f5b8d572d879d70c75711cb2d3a8c",
//       // "cookie": "pmpro_visit=1",
//       dnt: "1",
//       origin: "https://parcelfact.com",
//       referer: "https://parcelfact.com/member-area/",
//       "sec-ch-ua":
//         '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"Chrome OS"',
//       "sec-fetch-dest": "document",
//       "sec-fetch-mode": "navigate",
//       "sec-fetch-site": "same-origin",
//       "sec-fetch-user": "?1",
//       "upgrade-insecure-requests": "1",
//       "user-agent":
//         "Mozilla/5.0 (X11; CrOS x86_64 14909.132.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
//     },
//     data: data,
//   };

//   let myData;
//   try {
//     const resp = await axios(config);
//     myData = await JSON.stringify(resp.data);
//     // const authKey = await JSON.stringify(resp.data.authKey);
//     console.log(authKey);
//   } catch (error) {
//     console.log(error);
//   }

//   return myData;
// }

async function auth2() {
  const r = await fetch(
    "https://parcelfact.com/wp-content/plugins/parcel-facts-plugin/parcels/",
    {
      headers: {
        Referer:
          "https://parcelfact.com/wp-content/plugins/parcel-facts-plugin/map/index.html",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  const data = await r.json(); //assuming data is json
  // console.log(data);
  return data;
}

// async function getAuth() {
//   // after you login this function gets the auth key - response.data is authkey
//   var config = {
//     method: "get",
//     url: "https://parcelfact.com/wp-content/themes/parcel-fact/parcels/",
//     headers: {
//       authority: "parcelfact.com",
//       accept: "application/json, text/plain, */*",
//       "accept-language": "en-US,en;q=0.9",
//       // 'cookie': 'pmpro_visit=1; _ga=GA1.2.870794399.1661732418; __stripe_mid=6badd0fb-4841-4f1e-94ed-f39ece2a695c76d9a5; __adroll_fpc=15cd0e88a8c343657999761c0c80098c-1661732424487; _fbp=fb.1.1661732425098.561542103; wordpress_test_cookie=WP%20Cookie%20check; wp_lang=en_US; _gid=GA1.2.1483022640.1662076413; _gat_gtag_UA_66623201_15=1; __stripe_sid=057392e8-f55b-4fc3-85fe-c0f230868027ed1769; wordpress_logged_in_e9fe2dd1c66bb26aa18f86ec7d187628=dn%7C1662258096%7CFEY15T0D3Zg9kVKc4vmiuuL4nsfo7wG0KWfMr7Tyspv%7C4da0ae69b4f01b97531a01335e1019982ced1865ee69d5d2811a6d1481127137; __ar_v4=ICYJZ7HUUFA23DDRWALY4K%3A20220828%3A46%7C5YBAYURDQRHRFPC7IH2GHT%3A20220828%3A46%7CMKI7VG6NHBBXJJFKQRUTF6%3A20220828%3A46',
//       cookie: "pmpro_visit=1",
//       dnt: "1",
//       referer:
//         "https://parcelfact.com/wp-content/plugins/parcel-facts-plugin/map/index.html",
//       "sec-ch-ua":
//         '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"Chrome OS"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-origin",
//       "user-agent":
//         "Mozilla/5.0 (X11; CrOS x86_64 14909.132.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
//     },
//   };

//   try {
//     const response = await axiosInstance(config);
//     // console.log(JSON.stringify(response.data));
//     console.log(JSON.stringify(response.headers));
//     return JSON.stringify(response.data);
//     // cookieJar.myCookies = response.headers['set-cookie'];
//   } catch (error) {
//     console.log(error);
//   }

//   // await axios(config)
//   //   .then(function (response) {
//   //     // console.log(JSON.stringify(response.data));
//   //     return JSON.stringify(response.data);
//   //   })
//   //   .catch(function (error) {
//   //     console.log(error);
//   //   });
// }

// Function to get or generate a token
async function getToken() {
  const tokenData = await storage.getItem("tokenData");

  if (!tokenData) {
    // No token data found, generate a new token and save the timestamp
    const o = await login();
    const newToken = await getAuth();
    const timestamp = Date.now();
    await storage.setItem("tokenData", { token: newToken, timestamp });
    return newToken;
  }

  // Token data found, check if it's within 24 hours
  const { token, timestamp } = tokenData;
  const currentTime = Date.now();
  const timeDifference = currentTime - timestamp;
  const twentyFourHoursInMs = 8 * 60 * 60 * 1000; //8 hours
  // const twentyFourHoursInMs =  1000; //1 sec

  if (timeDifference < twentyFourHoursInMs) {
    // Token is less than 24 hours old, return the original token
    return token;
  } else {
    // Token is older than 24 hours, generate a new token and update the timestamp
    const o = await login();
    const newToken = await getAuth();
    const newTimestamp = Date.now();
    await storage.setItem("tokenData", {
      token: newToken,
      timestamp: newTimestamp,
    });
    return newToken;
  }
}
// Notes: the key point for future reference is the PARCELS request
// in auth2 with returns the auth code. if you can get this you can get the data
async function getOneAPN(lat, lon) {

  const o = await login3();
  const token = await auth2();

  if (lat && lon) {
    const obj = await test3(lat, lon, token.authKey);
    return obj.parcels[0];
  } else {
    return "coordinate missing";
  }
}

async () => {
  // await getSiteCookies();
  const o = await login3();
  // const tokenStr = await getAuth();
  const tokenStr = await auth2();
  // const tokenStr = await getToken();
  // const token = JSON.parse(tokenStr);
  // console.log("token", token);
  // await parcelData(1,2,token.authKey);
};

(async function run() {
  var begin = Date.now();

  const records = await getRecords(firstNum);
  console.log(records);
  // const o = await login();
  await randSleep(2000, 4000);
  // const tokenStr = await getAuth();
  const tokenStr = await getToken();
  await randSleep(2000, 4000);
  const token = JSON.parse(tokenStr);
  console.log("token", token);
  for (let i = 0; i < records.length; i++) {
    await randSleep(6000, 11000);
    let message;
    let json;
    let insertedJSON;
    let parcelObj;
    const record = records[i];
    console.log(record.coordinate);
    // console.log(record.coordinate.lat,record.coordinate.lon);
    if (record.coordinate && record.coordinate.lat && record.coordinate.lon) {
      json = await parcelData(
        record.coordinate.lat,
        record.coordinate.lon,
        token.authKey
      );
      console.log(json);
      const obj = JSON.parse(json);
      parcelObj = obj.parcels[0];
    } else {
      message = "coordinate missing";
    }
    if (parcelObj) {
      insertedJSON = parcelObj;
    } else if (message) {
      insertedJSON = { error: message };
    } else {
      insertedJSON = { error: "unavailable" };
    }

    try {
      const result = await collection.updateOne(
        { _id: record._id },
        { $set: insertedJSON }
      );
      console.log(
        `${result.modifiedCount} documents were inserted with the ${record._id}`
      );
    } catch (error) {
      console.log(error);
    }
  }

  var end = Date.now();
  console.log((end - begin) / 60000 + "secs");
  console.log("Finished");
});
// })();

async function getRecords(num) {
  const filter = {
    $and: [{ APN: { $exists: false } }, { error: { $exists: false } }],
  };

  records = await collection.find(filter).limit(num).toArray();
  console.log("number of records selected from db: ", records.length);
  return records;
}

async function getErrorRecords(num) {
  const filter = { error: { $exists: true } };

  records = await collection.find(filter).limit(num).toArray();
  console.log("number of records selected from db: ", records.length);
  return records;
}

// async function parcelData(lat, long, key) {
//   // url: 'https://sws.corelogic.com/api/v3.0.0/parcels?lat=33.802572971867946&lon=-84.47676560869998&pageNumber=1&pageSize=4&bundle=SpatialRecordUTPremium&authKey=5TIvSMhDepyGlBF5Gt3XMSHOPW67Obfk3zQqwsheITzvkzKZio',

//   // const url = (lat, long, key) => `https://sws.corelogic.com/api/v3.0.0/parcels?lat=33.802572971867946&lon=-84.47676560869998&pageNumber=1&pageSize=4&bundle=SpatialRecordUTPremium&authKey=${key}`;

//   const url = (lat, long, key) =>
//     `https://sws.corelogic.com/api/v3.0.0/parcels?lat=${lat}&lon=${long}&pageNumber=1&pageSize=4&bundle=SpatialRecordUTPremium&authKey=${key}`;

//   // const url = (lat, long, key) => `https://sws.corelogic.com/api/v3.0.0/parcels?lat=${lat}&lon=${long}&pageNumber=1&pageSize=4&bundle=SpatialRecordUTPremium&authKey=${key}`;

//   const myURL = url(lat, long, key);
//   var config = {
//     method: "get",
//     url: myURL,
//     headers: {
//       authority: "sws.corelogic.com",
//       accept: "application/json, text/plain, */*",
//       "accept-language": "en-US,en;q=0.9",
//       dnt: "1",
//       origin: "https://parcelfact.com",
//       referer: "https://parcelfact.com/",
//       "sec-ch-ua":
//         '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
//       "sec-ch-ua-mobile": "?0",
//       "sec-ch-ua-platform": '"Chrome OS"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "cross-site",
//       "user-agent":
//         "Mozilla/5.0 (X11; CrOS x86_64 14909.124.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
//       // 'Cookie': 'incap_ses_489_1954175=/Ay2ezhSDjN1K0u2rkfJBneuDmMAAAAAEsMcNdX6DfPYPh3ZzKLa9A==; visid_incap_1954175=OucH9xUkQIS+RpQoMeGlsucLDGMAAAAAQUIPAAAAAABfHnqxL1NxO2Aw9360Sl8K'
//     },
//   };

//   try {
//     const response = await axiosInstance(config);
//     return JSON.stringify(response.data);
//   } catch (error) {
//     console.log(error);
//   }
// }

async function login3() {
  resp = await fetch("https://parcelfact.com/land/", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua":
        '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      cookie:
        "pmpro_visit=1; _ga=GA1.1.1944047942.1699795020; __stripe_mid=86e6036d-e233-4ed3-822d-54b0a7d7bbf7660855; _hjSessionUser_3273888=eyJpZCI6IjMyOGU3MmJjLTdlMTUtNTc5OS1iNzBlLTQ5N2NlMGExMDcxYSIsImNyZWF0ZWQiOjE2OTk3OTUwMjA1ODAsImV4aXN0aW5nIjp0cnVlfQ==; wordpress_test_cookie=WP%20Cookie%20check; _hjIncludedInSessionSample_3273888=0; _hjSession_3273888=eyJpZCI6IjBkN2JiOGEyLWY5OWMtNDdkMy05M2FhLWFkY2UyNmE3MjkwMCIsImNyZWF0ZWQiOjE3MDAwMTMzNDUxNzgsImluU2FtcGxlIjpmYWxzZSwic2Vzc2lvbml6ZXJCZXRhRW5hYmxlZCI6dHJ1ZX0=; __stripe_sid=7347b5dc-c575-4e14-ba27-a38d040b7dcd48a3ec; wp_lang=en_US; _ga_WF9E6E6TRJ=GS1.1.1700013344.7.1.1700017236.0.0.0",
      Referer: "https://parcelfact.com/member-area/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: "pmpro_login_form_used=1&log=optionhomes11%40gmail.com&pwd=8MIS9SY3H%286ymrOhGJ2Vbd%212&wp-submit=Log+In&redirect_to=",
    method: "POST",
  });
}

async function test3(lat, lon, AuthToken) {

  // "https://api-prod.corelogic.com/spatial-tile/parcels/SpatialRecordUTPremium?lat=33.80045582382531&lon=-84.48427394094072&pageNumber=1&pageSize=4&access_token=Ehln39JeHKoMtduVvnzZVoMZgtwV",
  const myUrl = `https://api-prod.corelogic.com/spatial-tile/parcels/SpatialRecordUTPremium?lat=${lat}&lon=${lon}&pageNumber=1&pageSize=4&access_token=${AuthToken}`;

  r = await fetch(myUrl, {
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Chrome OS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://parcelfact.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: null,
    method: "GET",
  });

  const data = await r.json(); //assuming data is json
  return data;
  // console.log(data);
};

async function buildCSV() {
  //import mymaps
  // WKT,name,description,test
  // "POLYGON ((-3.7573242 56.909002300000004, -3.881555000000001 56.552116000000005, -4.4824219 56.6803738, -4.428197900000001 56.3194963, -3.2958984 56.340901200000005, -2.9522632000000004 56.783630800000005, -3.7573242 56.909002300000004))",Polygon 5,,
  // WKT,name,description,test
  // POLYGON ((-110.229718851 35.1231853609985, -110.234138151 35.1231969889985, -110.234207053334 35.1195588289985, -110.229787811 35.1195465199985, -110.229753331 35.1213659399985, -110.229718851 35.1231853609985)),Lux,,
}

exports.getOneAPN = getOneAPN;
// exports.getAuth = getAuth;
exports.getToken = getToken;
// exports.login = login;
