require("dotenv").config();
const { Dropbox } = require("dropbox");
const fs = require("fs");

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

    if (!response.ok) {
      console.error(
        "Error refreshing token:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new Error(
        `Failed to refresh token: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("New access token:", data.access_token);
    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error; // Re-throw the error to be caught by the handler
  }
}

exports.handler = async function (event, context) {
  try {
    console.log("event");
    console.log(event);
    let postArray = JSON.parse(event.body);
    console.log("posted", postArray);

    const data = await refreshToken();
    console.log("data", data);
    const ACCESS_TOKEN = data.access_token;

    const dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch: fetch }); // Pass fetch to Dropbox constructor

    const filesList = await dbx.filesListFolder({
      path: "",
    });
    console.log("Files:", filesList.result.entries);

    const sortedEntries = filesList.result.entries.sort((a, b) => {
      return new Date(b.server_modified) - new Date(a.server_modified);
    });

    console.log("Files:", sortedEntries);

    const filePaths = sortedEntries.map((entry) => entry.path_lower);
    console.log("filePaths:", filePaths);

    let resultArr = [];
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

          let sharedWaterLink;
          try {
            sharedWaterLink = await dbx.sharingListSharedLinks({
              path: waterFile,
              direct_only: true,
            });
            if (sharedWaterLink.result.links.length > 0) {
              sharedWaterLink = {
                result: {
                  url: sharedWaterLink.result.links[0].url.replace(
                    "?dl=0",
                    "?raw=1"
                  ),
                },
              };
            } else {
              sharedWaterLink = await dbx.sharingCreateSharedLinkWithSettings({
                path: waterFile,
              });
              sharedWaterLink = {
                result: {
                  url: sharedWaterLink.result.url.replace("?dl=0", "?raw=1"),
                },
              };
            }
          } catch (error) {
            sharedWaterLink = await dbx.sharingCreateSharedLinkWithSettings({
              path: waterFile,
            });
            sharedWaterLink = {
              result: {
                url: sharedWaterLink.result.url.replace("?dl=0", "?raw=1"),
              },
            };
          }

          let sharedContourLink;
          try {
            const sharedContourLinks = await dbx.sharingListSharedLinks({
              path: contourFile,
              direct_only: true,
            });
            if (sharedContourLinks.result.links.length > 0) {
              sharedContourLink = {
                result: {
                  url: sharedContourLinks.result.links[0].url.replace(
                    "?dl=0",
                    "?raw=1"
                  ),
                },
              };
            } else {
              sharedContourLink = await dbx.sharingCreateSharedLinkWithSettings(
                {
                  path: contourFile,
                }
              );
              sharedContourLink = {
                result: {
                  url: sharedContourLink.result.url.replace("?dl=0", "?raw=1"),
                },
              };
            }
          } catch (error) {
            sharedContourLink = await dbx.sharingCreateSharedLinkWithSettings({
              path: contourFile,
            });
            sharedContourLink = {
              result: {
                url: sharedContourLink.result.url.replace("?dl=0", "?raw=1"),
              },
            };
          }

          // Directly assign the modified URLs to myRow
          myRow.WaterURL = sharedWaterLink.result.url.replace("&dl=0", "&raw=1");
          myRow.ContourURL = sharedContourLink.result.url.replace("&dl=0", "&raw=1");
          resultArr.push(myRow);
        }
      }
    }
    console.log("resultArr:", resultArr);

    return {
      statusCode: 200,
      body: JSON.stringify(resultArr), // Return resultArr instead of data
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.toString(),
      }),
    };
  }
};
