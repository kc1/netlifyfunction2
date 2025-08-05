const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

async function parseAgentdata(html) {
  const { window } = await new JSDOM(html);
  const $ = require("jquery")(window);

  // const sel = "div[class*='AgentDetailsSubtext']";
  // const agentStr = await $(sel).text();
  // console.log( "o ",agentStr);

  const sel1 = "#__NEXT_DATA__";
  const json = $(sel1).text();
  const objs = JSON.parse(json);
  // console.log(objs);
  const advertisers =
    objs.props.pageProps.initialReduxState.propertyDetails.advertisers;
  console.log(advertisers);
  myArr = [];
  for (let i = 0; i < advertisers.length; i++) {
    const advertiser = advertisers[i];
    let agentData = {};
    agentData.emails = [];
    agentData.phones = [];
    agentData.name = advertiser.name;
    agentData.emails.push(advertiser.email);
    agentData.emails.push(advertiser.office.email);
    const phones = advertiser.phones;
    for (let j = 0; j < phones.length; j++) {
      const phone = phones[j];
      agentData.phones.push(phone.number);
    }
    myArr.push(agentData);
  }
  console.log(myArr);
  return myArr;
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

exports.handler = async function (event, context) {
  const url = JSON.parse(event.body).val;
  const html = await getHTMLWithScrapingant2(url);
  const agentStr = await parseAgentdata(html);
  console.log("o ", agentStr);

  // const body = JSON.parse(event.body); // postencoded
  // const lat = body.lat;
  // const lon = body.lon;
  // console.log("starting ", body);
  // console.log("lat ", lat);
  // console.log("lon ", lon);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: agentStr,
    }),
  };
};
