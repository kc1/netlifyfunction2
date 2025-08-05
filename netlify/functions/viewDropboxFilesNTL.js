require("dotenv").config();
const { Console } = require("console");
const { Dropbox } = require("dropbox");
const fs = require("fs");
const { console } = require("inspector");
// const { refreshDropboxToken } = require("./refreshTokenNTL");

async function refreshToken() {
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
    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
  }
}

exports.handler = async function (event, context) {
  try {
    // Refresh Dropbox token and create a new Dropbox instance.
    const data = await refreshToken();
    console.log("data", data);
    const ACCESS_TOKEN = data.access_token;
    // const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

    // List files in the root folder.
    // const folderContent = await dbx.filesListFolder({ path: "screentest1" });
    // console.log("Files in folder:", folderContent.entries);

    const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });
    // Parse the incoming JSON from the event body
    // const requestBody = JSON.parse(event.body || "[]");
    // const postArray = Array.isArray(requestBody) ? requestBody : [requestBody];
    // console.log("Files array:", postArray);
    // Next, get list of dropbox file objects in screencast1 app folder
    const filesList = await dbx.filesListFolder({
      path: "",
    });
    console.log("Files:", filesList.result.entries);
    // return
    // Sort entries in descending order by server_modified date
    const sortedEntries = filesList.result.entries.sort((a, b) => {
      return new Date(b.server_modified) - new Date(a.server_modified);
    });

    console.log("Files:", sortedEntries);

    const filePaths = sortedEntries.map((entry) => entry.path_lower);
    console.log("filePaths:", filePaths);
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify({
    //     data: filePaths,
    //   }),
    // };

    // return

    resultArr = [];
    for (var i = 0; i < postArray.length; i++) {
      let myRow = postArray[i];
      if (myRow.APN != "") {
        const searchString = (
          myRow.state +
          "_" +
          myRow.county +
          "_" +
          myRow.APN
        ).toLowerCase();
        // Filter files that start with the search string
        console.log(searchString);

        var matchingFiles = filePaths.filter(function (file) {
          return file.includes(searchString);
        });

        console.log("matchingFiles: ");
        console.log(matchingFiles);
        if (matchingFiles.length) {
          var waterFile = matchingFiles.find((file) => file.includes("water"));
          var contourFile = matchingFiles.find((file) =>
            file.includes("contours")
          );

          const sharedWaterLink = await dbx.sharingCreateSharedLinkWithSettings(
            {
              path: waterFile,
            }
          );
          const sharedContourLink =
            await dbx.sharingCreateSharedLinkWithSettings({
              path: contourFile,
            });
          myRow.WaterURL = sharedWaterLink.result.url;
          myRow.ContourURL = sharedContourLink.result.url;
          resultArr.push(myRow);
        }
      }
    }
    console.log("resultArr:", resultArr);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: resultArr,
      }),
    };
    // };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error,
      }),
    };
  }
};
