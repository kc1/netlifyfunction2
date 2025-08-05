
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token:
      "rz3n5_bhZvgAAAAAAAAAAZMK3Wfc-CV2rxof3x3lMl9zdSFscuUi_Km0XeZEssQb",
    client_id: "4wlwoffttm98qno",
    client_secret: "6xe8cx18dgq5oa5",
  });

  try {
    const response = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    console.log("New access token:", data.access_token);


    return {
      statusCode: 200,
      body: JSON.stringify({
        message: data,
      }),
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
};