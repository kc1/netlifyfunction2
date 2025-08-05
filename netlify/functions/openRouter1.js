const fetch = require("node-fetch");

async function openRouterApiRequest(myPrompt) {
  const apiKey = "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";
  // Replace apiKey above with a secure value in production

  const imageUrl = "https://drive.google.com/thumbnail?sz=w1000&id=1cpHMDtvv5xoEMYqe2PdQZBpIrZIKuoba";
  const apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: "meta-llama/llama-4-maverick",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: myPrompt
          },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  };

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  };

  try {
    const response = await fetch(apiEndpoint, options);
    const responseBody = await response.text();
    console.log('Response Code:', response.status);
    console.log('Response Body:', responseBody);

    // Parse the response as JSON
    const jsonResponse = JSON.parse(responseBody);
    console.log(jsonResponse);
    return jsonResponse.choices[0].message.content;
  } catch (e) {
    console.error('Failed to fetch or parse response as JSON:', e.message);
  }
}

function parseThyroidData(rawText) {
  // Ensure rawText is a string
  const text = typeof rawText === "string" ? rawText : String(rawText);
  
  // Helper function to extract text between two markers
  function extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return '';
    }
    return text.substring(startIndex + startMarker.length, endIndex).trim();
  }

  // Helper function to format and parse the extracted section
  function formatAndParseSection(sectionText) {
    if (!sectionText) return [];
    // Add double quotes around keys
    let formatted = sectionText.replace(/(\w+):/g, '"$1":');
    // Replace single quotes with double quotes
    formatted = formatted.replace(/'/g, '"');
    // Ensure the string is a valid JSON array
    if (!formatted.startsWith('[')) {
      formatted = '[' + formatted + ']';
    }
    try {
      return JSON.parse(formatted);
    } catch (e) {
      console.error('Error parsing section:', e);
      return [];
    }
  }

  // Extract and parse the SIZE section
  const sizeRaw = extractSection(text.trim(), 'SIZE1', 'END1');
  const sizeArray = formatAndParseSection(sizeRaw.trim());

  // Extract and parse the NODULES2 section
  const nodulesRaw = extractSection(text.trim(), 'NODULES2', 'END2');
  const nodulesArray = formatAndParseSection(nodulesRaw);

  return {
    size: sizeArray,
    nodules: nodulesArray
  };
}

function createThyroidReport() {

  const prompt1 = " In the role of an OCR program and using the radiology TIRADS system for reference, can you convert the entire page from text and handwriting into text? Based on the top of the page,  Can you produce an array of objects as follows: [{rightLobe: height x width x depth (in cms)}, {leftLobe: height x width x depth (in cms)}, {isthmus : thickness (in millimetres)}] . This  array is called SIZE. In the table in the middle of the pagethere is a table:  In the third column (Size), if a number contains decimal, it is in centimeters, if not it is in millimeters. Please note that in the chart in the middle of page,the second column(location) must be Upper pole, Mid Pole or Lower pole only. The 4th column (Composition) has options of : S or M or C only. Also the only options for the 5th Column (Echogenicity) are 'up pointing arrow', 'down pointing arrow' or '='. The 6th column (Taller than wide) has only Y or N as options. The 8th column (Echogenic foci) has the following options only: No artifacts (0), Large comet-tail artifacts (0),Macrocalcifications (1), Peripheral calcifications (2), Punctate echogenic foci (3).Can you add a 9th column to the table containing  the measurements of the nodules in the diagram at the bottom in the appropriate row (eg matching R1 with R1). Next can you print an  array of objects with each object corresponding to a row in the middle chart . The Keys of each object should be: location, side,composition ,echogenicity , shape ,  margins ,echogenicFoci ,currentSize ,previousSize , score and classification. For each of the keys please fill out the values based on the following guide and please include the points (in brackets) for each feature: 'In the location:upper/mid/lower  side:right/left/isthmus thyroid lobe , there is a Composition:Cystic or Almost completely cystic(0)/Spongiform(0)/Mixed cystic(1)/Solid(2)/Cannot determine,  Echogenicity:Anechoic (0)/Hyperechoic(1)/Isoechoic(1)/Hypoechoic(2)/Very hypoechoic(3)/Cannot determine, Shape:Not taller than wide/Taller than wide, Margins:Smooth/ill-defined/Lobulated/Irregular/Extra thyroidal extension/Cannot determine nodule.  echogenicFoci options:No artifacts/Large comet- tail artifacts/Macrocalcifications/Peripheral calcifications/Punctate echogenic foci'.for score please add up the numbers in all the brackets for each of the objects features. classification should be TR1-score of 1 , TR2- score of 2, TR3 - score of 3, TR4- score of 4 to 6, TR5 - score greater than 6. Please make sure to include each features score in brackets, for example: Macrocalcifications (1),Hypoechoic(2). Please include only rows with actual data. Please convert all sizes to cm. Please make sure each measurement is marked with cm if it is measured in cm, for example 2.3 x 3.1 x1.2 cm.  This array is called NODULES. Finally print out the following: 1) the word SIZE1 on one line followed by the SIZE array starting on the next line. Then Print the word END1 on the next line. Then Print a Blank line follwed by the word NODULES2 on the next line, followed by the NODULES array starting on the next line, followed by the word END2 on a new line, followed by 2 blank lines ";

  const outputString = openRouterApiRequest(prompt1);
  console.log(outputString);

  const parsedData = parseThyroidData(outputString);
  console.log(parsedData.size);    // Array of size objects
  console.log(parsedData.nodules); // Array of nodule objects

  const reports = generateNoduleReports(parsedData.nodules);
  console.log(reports);
  // const cleanedReports = cleanReports(reports);
  // Get the active spreadsheet and sheet
  // var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Set the value of cell A1 to the report text
  // sheet.getRange("A1").setValue(reports);


  //   CLINICAL HISTORY: 73 years Female.    .

  // TECHNIQUE: Multiple ultrasonographic images of the thyroid gland were obtained.

  // COMPARISON: None.

  // FINDINGS: The thyroid gland is     in size, with     echogenicity. The right thyroid lobe measures     cm. The left thyroid lobe measures     cm. The isthmus measures     mm AP.



  // There are no significant additional masses or adenopathy.

  // IMPRESSION:    .

  // TR1= 0 Points: No FNA or Follow-up
  // TR2= 2 Points: No FNA or Follow-up
  // TR3= 3 Points: FNA if >2.5 cm/Follow if >1.5 cm/No FNA or follow-up if <1.5 cm
  // TR4= 4-6 Points: FNA if >1.5 cm/Follow if >1.0 cm/No FNA or follow of <1.0cm
  // TR5= Greater than 6 points: FNA if >1.0cm/Follow if >0.5cm/No FNA or follow-up if <0.5cm


  // CLINICAL HISTORY: Patient Age Patient Gender. history.

  // TECHNIQUE: Multiple ultrasonographic images of the thyroid gland were obtained.

  // COMPARISON: Field 2.

  // FINDINGS: The thyroid gland is Field 3 in size, with Field 4 echogenicity. The right thyroid lobe measures Field 5 cm. The left thyroid lobe measures Field 6 cm. The isthmus measures Field 7 mm AP.

  // nodules

  // add

  // IMPRESSION: Field 9.

  // TIRADS Table



  // In the location:upper/mid/lower  side:right/left/isthmus thyroid lobe , there is a Composition:Cystic/Almost completely cystic/Spongiform/Mixed cystic/Solid/Cannot determine,  Echogenicity:Anechoic/Hyperechoic/Isoechoic/Hypoechoic/Very hypoechoic/Cannot determine, Shape:Not taller than wide/Taller than wide, Margins:Smooth/ill-defined/Lobulated/Irregular/Extra thyroidal extension/Cannot determine nodule with Echogenic foci:No artifacts/Large comet- tail artifacts/Macrocalcifications/Peripheral calcifications/Punctate echogenic foci,  measuring Right Thyroid Size , previously Right Thyroid Size, for a total score of Right Thyroid Size, and a classification of class.

  // In the location:upper/mid/lower  side:right/left/isthmus thyroid lobe , there is a Composition:Cystic/Almost completely cystic/Spongiform/Mixed cystic/Solid/Cannot determine,  Echogenicity:Anechoic/Hyperechoic/Isoechoic/Hypoechoic/Very hypoechoic/Cannot determine, Shape:Not taller than wide/Taller than wide, Margins:Smooth/ill-defined/Lobulated/Irregular/Extra thyroidal extension/Cannot determine nodule with Echogenic foci:No artifacts/Large comet- tail artifacts/Macrocalcifications/Peripheral calcifications/Punctate echogenic foci,  measuring Right Thyroid Size , previously Right Thyroid Size, for a total score of Right Thyroid Size, and a classification of class.


}

function generateNoduleReports(nodules) {
  var reports = '';
  for (var i = 0; i < nodules.length; i++) {
    var nodule = nodules[i];
    console.log(nodule);
    reports += "In the " + nodule.location + " of the " + nodule.side + " thyroid lobe, there is a " +
      nodule.composition + ", " + nodule.echogenicity + ", " + nodule.shape + ", " +
      nodule.margins + ", nodule with " + nodule.echogenicFoci + ", measuring " +
      nodule.currentSize + ", previously " + nodule.previousSize + ", for a total score of " +
      nodule.score + ", and a classification of " + nodule.classification + ".\n\n";
  }

  console.log(reports);
  return reports;
}










exports.handler = async (event, context) => {
  console.log("Hello from Netlify Function!");

  let postedFilename = null;
  if (event.httpMethod === "POST") {
    try {
      const data = JSON.parse(event.body);
      postedFilename = data.filename;
      console.log("Received filename:", postedFilename);
    } catch (error) {
      console.error("Error parsing the request body:", error);
    }
  }

  // Call createThyroidReport and wait for its response.
  const response = await createThyroidReport();
  console.log("Response from createThyroidReport:", response);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello World",
      // filename: postedFilename,
      // response: response,
    }),
  };
};
