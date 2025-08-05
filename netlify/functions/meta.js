const fetch = require('node-fetch').default
var encoding = require("encoding");

exports.handler = async function () {

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello world!'
        })
    }

}