// const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cheerio = require("cheerio");

exports.handler = async function (event, context) {

  const body = JSON.parse(event.body); // postencoded
  // const apn = '110067270';
  const apn = body.apn;
  const verify = body.verify;
  console.log('starting ', apn);
  const data = await run6(apn, verify);
  console.log(data.Structure);
  let obj = {};
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: obj
    })
  }

}




async function buildURL(apn) {

  const scb = apn.slice(0, 3);
  const scm = apn.slice(3, 5);
  const scp = apn.slice(5);

  return `https://www.to.pima.gov/propertyInquiry/?stateCodeB=${scb}&stateCodeM=${scm}&stateCodeP=${scp}`;

}
function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}

// async function run() {
exports.handler = async function (event, context) {

  const body = JSON.parse(event.body); // postencoded
  // const apn = '129050070';
  const apn = body.apn;
  console.log('starting ', apn);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  const url = await buildURL(apn);
  // const url = "https://www.to.pima.gov/propertyInquiry/?stateCodeB=129&stateCodeM=05&stateCodeP=0070";

  await page.goto(url, { waitUntil: 'networkidle0' });
  // await delay(2000);
  const data = await page.content();
  await browser.close();
  const $ = cheerio.load(data);
  let myObj = {}
  const head = $('#tblAcctBal > thead > tr');
  const foot = $('#tblAcctBal > tfoot > tr');
  const h = $(head).find('th');
  const f = $(foot).find('th');
  for (let i = 0; i < h.length; i++) {
    const hElement = $(h[i]).text();
    const fElement = $(f[i]).text();
    // myArr.push({ [hElement]: fElement });
    myObj[hElement] = fElement;
  }
  // console.log(myArr);
  console.log(myObj);
  //   0:
  // {PAY: ''}
  // 1:
  // {TAX YEAR: ''}
  // 2:
  // {CERT NO  : ''}
  // 3:
  // {INTEREST DATE: ''}
  // 4:
  // {INTERESTPERCENT: ''}
  // 5:
  // {AMOUNT: '$0.00'}
  // 6:
  // {INTEREST: '$0.00'}
  // 7:
  // {FEES: '$0.00'}
  // 8:
  // {PENALTIES: '$0.00'}
  // 9:
  // {TOTAL DUE: '$0.00'}


  console.log('---------');
  console.log('---------');
  return {
    statusCode: 200,
    body: JSON.stringify({
      // message: { 'apn': apn, 'myArr': myArr, 'totalDue': totalDueNum }
      message: { 'apn': apn, 'myObj': myObj }
    })
  }

};

// run();