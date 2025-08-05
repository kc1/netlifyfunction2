const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

async function parsePage(html) {
  const { window } = await new JSDOM(html);
  const $ = require("jquery")(window);

  const sel = "#__NEXT_DATA__";
  const jsonInString = $(sel).text();
  console.log(jsonInString);

  const myJson = await JSON.parse(jsonInString);
  const propArr = myJson.props.pageProps.properties;
  console.log(propArr[0]);
  let coordinates = [];
  if (propArr) {
    for (let i = 0; i < propArr.length; i++) {
      const property = propArr[i];
      const flagObj = property.flags;
      const flagKeys = Object.keys(flagObj);
      let myflags = [];
      for (let i = 0; i < flagKeys.length; i++) {
        const flagkey = flagKeys[i];
        if (flagObj[flagkey]) {
          myflags.push(flagkey);
        }
      }
      // const lot_sqft = property?.description?.lot_sqft;
      // const lot_acres = lot_sqft / 43560;
      // const ppa = property.list_price / lot_acres;
      // const county = property?.location?.county?.name;
      // const address = property?.location?.address?.line;
      // // const myLink = 'https://www.realtor.com/realestateandhomes-detail/' + property.permalink + "?from=srp-list-card";
      // const myLink =
      //   "https://www.realtor.com/realestateandhomes-detail/" +
      //   property.permalink +
      //   "?from=srp";
      coordinates.push({
        // lot_acres: lot_acres,
        // ppa: ppa,
        id: i,
        listing_id: property.listing_id,
        // coordinate: property.location.address.coordinate,
        // price: property.list_price,
        // list_date: property.list_date,
        // AAlink: myLink,
        flags: myflags.join(","),
        // address: address,
        // county: county,
        // lot_sqft: lot_sqft,
      });
    }
  }
  return coordinates;
}

async function getHTMLWithScrapingant2(buildURL) {
  // const fetch = require("node-fetch");

  const encodedURL = encodeURIComponent(buildURL);

  const apiUrl = `https://api.scrapingant.com/v2/general?url=${encodedURL}&x-api-key=3c59fe0e311a474694cd2849f594f135&return_page_source=true`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        useQueryString: true,
      },
    });

    if (response.ok) {
      const body = await response.text();
      console.log(body);
      return body;
    } else {
      console.error(`Request failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

async function updateFirstPageFlags(myURL, state) {
  const html = await getHTMLWithScrapingant2(myURL);
  if (!html) {
    console.log("no html in scrapefirstpage -- blocked?");
    return;
  }
  const objArr = await parsePage(html);
  // let counter = 0;

  // here you have to update each object one at a time
  // Filter criteria to find the document
  for (let i = 0; i < objArr.length; i++) {
    let obj = objArr[i];
    // obj["state"] = state;
    obj["updatedAt"] = new Date();
    // console.log("current obj: ", obj);
  }
  return objArr;
}
exports.handler = async function (event, context) {
  const obj = JSON.parse(event.body);
  const url = obj.val;
  const st = obj.st;
  console.log(obj);

  const data = await updateFirstPageFlags(url, st);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: data,
    }),
  };
};
