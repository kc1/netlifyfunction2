/**
 * Google Apps Script function to call the Netlify realtorSubdivComps function
 * Sends rowObj and coll data and receives the response
 */
function callRealtorSubdivComps() {
  // Replace with your actual Netlify function URL
  const NETLIFY_FUNCTION_URL = 'https://your-site-name.netlify.app/.netlify/functions/realtorSubdivComps';
  
  // Example rowObj data - modify this with your actual data
  const rowObj = {
    lon: -89.123456,  // Longitude
    lat: 43.123456,   // Latitude
    lot_acres: 5.2,   // Lot size in acres
    listing_id: "123456789", // Optional listing ID
    SOLD_PPA_AVG: 0   // Will be updated by the function
  };
  
  // Collection name
  const coll = "wisconsinSold"; // or your preferred collection
  
  // Prepare the request payload
  const payload = {
    rowObj: rowObj,
    coll: coll
  };
  
  // Set up the request options
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload)
  };
  
  try {
    // Make the request to your Netlify function
    const response = UrlFetchApp.fetch(NETLIFY_FUNCTION_URL, options);
    
    // Get the response code
    const responseCode = response.getResponseCode();
    
    // Get the response content
    const responseText = response.getContentText();
    
    // Parse the JSON response
    const responseData = JSON.parse(responseText);
    
    // Log the results
    console.log('Response Code:', responseCode);
    console.log('Response Data:', responseData);
    
    // Check if the request was successful
    if (responseCode === 200) {
      console.log('Success! Updated SOLD_PPA_AVG:', responseData.rowObj.SOLD_PPA_AVG);
      console.log('Min Acres:', responseData.rowObj.MIN_ACRES);
      console.log('Max Acres:', responseData.rowObj.MAX_ACRES);
      
      // Return the updated rowObj for further processing
      return responseData.rowObj;
    } else {
      console.error('Error:', responseData.error);
      return null;
    }
    
  } catch (error) {
    console.error('Request failed:', error.toString());
    return null;
  }
}

/**
 * Helper function to call the function with custom data
 * @param {Object} rowObj - The row object with lon, lat, lot_acres, etc.
 * @param {string} coll - The collection name
 * @returns {Object|null} - The updated rowObj or null if failed
 */
function callRealtorSubdivCompsWithData(rowObj, coll) {
  const NETLIFY_FUNCTION_URL = 'https://your-site-name.netlify.app/.netlify/functions/realtorSubdivComps';
  
  const payload = {
    rowObj: rowObj,
    coll: coll || "wisconsinSold"
  };
  
  const options = {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(NETLIFY_FUNCTION_URL, options);
    const responseCode = response.getResponseCode();
    const responseData = JSON.parse(response.getContentText());
    
    if (responseCode === 200) {
      console.log('Success! Updated SOLD_PPA_AVG:', responseData.rowObj.SOLD_PPA_AVG);
      return responseData.rowObj;
    } else {
      console.error('Error:', responseData.error);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error.toString());
    return null;
  }
}

/**
 * Example function to process multiple properties
 * This shows how you might call the function for multiple rows
 */
function processMultipleProperties() {
  // Example array of properties to process
  const properties = [
    {
      lon: -89.123456,
      lat: 43.123456,
      lot_acres: 5.2,
      listing_id: "prop1"
    },
    {
      lon: -89.234567,
      lat: 43.234567,
      lot_acres: 3.8,
      listing_id: "prop2"
    }
  ];
  
  const results = [];
  
  // Process each property
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`Processing property ${i + 1}:`, property.listing_id);
    
    const result = callRealtorSubdivCompsWithData(property, "wisconsinSold");
    
    if (result) {
      results.push(result);
      console.log(`Property ${property.listing_id} - SOLD_PPA_AVG: ${result.SOLD_PPA_AVG}`);
    } else {
      console.log(`Failed to process property ${property.listing_id}`);
    }
  }
  
  return results;
}
