const fetch = require('node-fetch')
var encoding = require("encoding");
const timestamp = require('unix-timestamp');

// const bluebird = require("bluebird");

const requestverificationtoken = "0xbRnb1lh0zsbjSOgva4NjhHpIQWU7rxcuPMcSMdiO49778S0T9agjJiWM-9_KEyZe8s88gvM9EiimY2hbek9YugWEUm4ZCuIDbZ3RmeqGY1:maXZc5_c4fezGSzpblzALRRY6gN-_wbHtqFnaGfvpM1fCMz9QJtKc8dwuDFMsx8IKI_HHHzwqXCwKJKcFqgBxLvA97uUHQNPOpBq2nktxCo1";
// "requestverificationtoken": "0xbRnb1lh0zsbjSOgva4NjhHpIQWU7rxcuPMcSMdiO49778S0T9agjJiWM-9_KEyZe8s88gvM9EiimY2hbek9YugWEUm4ZCuIDbZ3RmeqGY1:maXZc5_c4fezGSzpblzALRRY6gN-_wbHtqFnaGfvpM1fCMz9QJtKc8dwuDFMsx8IKI_HHHzwqXCwKJKcFqgBxLvA97uUHQNPOpBq2nktxCo1",
// const verify = 'bEBIC%2fCH1rK8bbXyMTvFKQeilnahApH3VHHAPR%2f%2fBu4%3d';
async function getSessionCookie(str,verify) {

    // "body": "{\"parcelNumber\":\"123\",\"verify\":\"E%2bYuK0lWZ9n1mkYtup4CbR4q6q4mheYLdJXXuyOMilQ%3d\"}",
    // const b = '{\"taxPayer\":\"aaa\",\"verify\":\"KULNfBX43eEKDKSfYSbZr7gscQd0aBP%2bv5uRPjtKvdg%3d\"}';
    const b = '{\"parcelNumber\":\"110067270\",\"verify\":\"yP61BgjPMyqV76%2fdkAQKKqAelLhadoHtsCHvxC%2fkv9g%3d\"}';
    // let parsed = JSON.parse(b);
    let parsed = {};
    parsed.parcelNumber = str;
    parsed.verify = verify;
    console.log(parsed);
    const newBodyStr = JSON.stringify(parsed);
    console.log(newBodyStr);
    console.log(newBodyStr);

    try {

        const response = await fetch("https://www.asr.pima.gov/Parcel/CheckParcelHome", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json;charset=UTF-8",
                "credentials": "include",
                "requestverificationtoken": requestverificationtoken,
                "sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\", \"Google Chrome\";v=\"108\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Chrome OS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "Referer": "https://www.asr.pima.gov/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": newBodyStr,
            "method": "POST"
        });
        const body = await response.text();
        // const h = response.headers();
        // console.log(body);
        const cookieArr = response.headers.raw()['set-cookie'];
        console.log(response.headers.get('set-cookie'));


        // console.log(body);
        // console.table(res)
        const cookieStr = cookieArr.pop();
        const cookiePieces = cookieStr.split(';');
        // console.log(response.headers.raw()['set-cookie']);
        // console.log('cookiepieces', cookiePieces[0]);
        return cookiePieces[0];

    } catch (error) {
        console.log('cookie arr error!! -- if you get rgis you have to replace verify token in request')
        console.log("{taxPayer: 'aab', verify: 'yP61BgjPMyqV76%2fdkAQKKqAelLhadoHtsCHvxC%2fkv9g%3d'}");
        return false
    }

}


async function run6(apn,verify) {
    const cookie = await getSessionCookie(apn,verify);
    console.log(cookie);
    console.log(apn)
    const now = (timestamp.now() * 1000).toString().trim();
    // console.log(1669410712221);
    console.log(now);
    const b = '{\"parcelNumber\":\"110067270\"}';
    let parsed = JSON.parse(b);
    parsed.parcelNumber = apn;
    console.log(parsed);
    const newBodyStr = JSON.stringify(parsed);

    const r = await fetch(`https://www.asr.pima.gov/Parcel/GetSearchResults?ts=${now}&q=${apn}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": "\"Google Chrome\";v=\"107\", \"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Chrome OS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "cookie": `${cookie}`,
            "Referer": "https://www.asr.pima.gov/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });

    const body = await r.json()
    console.log(body);



    try {
        const r = await fetch("https://www.asr.pima.gov/Parcel/GetParcel", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json;charset=UTF-8",
                // "requestverificationtoken": requestverificationtoken,
                "requestverificationtoken": "0xbRnb1lh0zsbjSOgva4NjhHpIQWU7rxcuPMcSMdiO49778S0T9agjJiWM-9_KEyZe8s88gvM9EiimY2hbek9YugWEUm4ZCuIDbZ3RmeqGY1:maXZc5_c4fezGSzpblzALRRY6gN-_wbHtqFnaGfvpM1fCMz9QJtKc8dwuDFMsx8IKI_HHHzwqXCwKJKcFqgBxLvA97uUHQNPOpBq2nktxCo1",
                "sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\", \"Google Chrome\";v=\"108\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Chrome OS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                // "cookie": "ASP.NET_SessionId=aonfqye5wi1k032y0mvgmbsj",
                "cookie": `${cookie}`,
                "Referer": "https://www.asr.pima.gov/Parcel/Index",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "{\"parcelNumber\":\"110067270\"}",
            "method": "POST"
        });
        const body = await r.json()
        console.log(body.Data);
        return body.Data;




    } catch (error) {
        console.log(error);
    }

}



exports.handler = async function (event, context) {

    const body = JSON.parse(event.body); // postencoded
    // const apn = '110067270';
    const apn = body.apn;
    const verify = body.verify;
    console.log('starting ', apn);
    const data = await run6(apn,verify);
    console.log(data.Structure);
    let obj = {};
    obj.apn = apn;
    obj.parcelUse = data.Property.ParcelUse || "";
    obj.long = data.Area.Longitude || "";
    obj.lat = data.Area.Latitude || "";
    obj.LandSqFt = data.Area.LandSqFt || "";
    if (data.Structure && data.Structure[0] && data.Structure[0].PropType) {
        obj.PropType = data.Structure[0].PropType || "";
    }
    obj.ParcelOwner = data.TaxPayer.ParcelOwner.trim() || "";
    obj.Mail2 = data.TaxPayer.Mail2.trim() || "";
    obj.Mail3 = data.TaxPayer.Mail3.trim() || "";
    obj.Mail4 = data.TaxPayer.Mail4.trim() || "";
    obj.Mail5 = data.TaxPayer.Mail5.trim() || "";
    const Zip = data.TaxPayer.Zip.trim() || "";
    const Zip4 = data.TaxPayer.Zip4 || "";
    let zip
    if (Zip4.length > 0) {
        zip = Zip + '-' + Zip4;
    } else {
        zip = Zip;
    }
    obj.zip = zip;
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: obj
        })
    }

}


