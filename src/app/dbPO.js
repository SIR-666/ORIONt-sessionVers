// const config = require("../db/config");
import URL from "./url";

async function createEmptyPO(data){
  try {
    const { startTime, endTime, plant, line, groupSelection } = data;
    const date_start = new Date(startTime + 'Z'); // Parse startTime to Date
    const date_end = new Date(endTime + 'Z'); // Parse startTime to Date
    if (isNaN(date_start) || isNaN(date_end)) {
      throw new Error('Invalid date format for start or end time');
    }
    console.log("Sending data to createEmptyPO:", { date_start, date_end, plant, line, groupSelection });
    const response = await fetch(`${URL.URL}/createEmptyPO`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date_start,
        date_end,
        plant, 
        line,
        groupSelection
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create stoppage entry');
    }

    const result = await response.json();
    console.log("Result from createEmptyPO API:", result);
    return {rowsAffected: result.rowsAffected, message: result.message, id: result.id }; // Return the response object, e.g., { message, id }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getPO(id) {
    try {
      const response = await fetch(`${URL.URL}/getPO/${id}`, {cache: 'no-cache'});
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error fetching PO: ', error);
    }
}

async function getPOLine(line) {
  try {
    const response = await fetch(`${URL.URL}/getAllPOLine/${line}`, {cache: 'no-store'});
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching PO: ', error);
  }
}

async function getAllPO(line, year, month, shift, date) {
    try {
      const [responseRes, requestRes, fetchRes] = await Promise.all([
        fetch(`${URL.URL}/getAllPO/${line}/${shift}/${date}`, { cache: 'no-store' }).catch(err => {
          console.error("Error fetching responseRes:", err);
          return null;
        }),
        fetch(`${URL.urlSAP}/${year}/${month}/GF%20MILK`).catch(err => {
          console.error("Error fetching requestRes:", err);
          return null;
        }),
        fetch(`${URL.URL}/getOrders`).catch(err => {
          console.error("Error fetching fetchRes:", err);
          return null;
        })
      ]);

      if (!responseRes || !requestRes || !fetchRes) {
        console.warn("One or more fetches failed. Proceeding with available data.");
      }
      
      const parseJSON = async (response, responseName) => {
        if (!response) return [];
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(`${responseName} did not return JSON. Content-Type: ${contentType}`);
          const text = await response.text();
          console.warn(`${responseName} response body:`, text);
          return []; // Return empty array for non-JSON responses
        }
        return response.json().catch((err) => {
          console.error(`Error parsing JSON from ${responseName}:`, err);
          return []; // Return empty array if JSON parsing fails
        });
      };
  
      // Safely parse all responses
      const response = await parseJSON(responseRes, "responseRes");
      const request = await parseJSON(requestRes, "requestRes");
      const fetchData = await parseJSON(fetchRes, "fetchRes");

      const filterMaterials = (data, line) => {
        if (["Line A", "Line B", "Line C", "Line D"].includes(line)) {
          return data.filter(item => item.MATERIAL?.includes("ESL"));
        } else if (["Line E", "Line F", "Line G"].includes(line)) {
          return data.filter(item => item.MATERIAL?.includes("UHT"));
        }
        return [];
      };
  
      const filteredRequest = filterMaterials(request, line);
  
      console.log("Response Data:", response);
      console.log("Request Data:", filteredRequest);
      console.log("Fetched Data:", fetchData);
      let combinedData = [];
      if (response.length === 0) {
        const requestData = request;
        const seen = new Set(fetchData.map((item) => item.id));
          combinedData = [
              ...filteredRequest.filter((item) => {
                  const uniqueId = item["NO PROCESS ORDER"];
                  if (seen.has(uniqueId)) return false;
                  seen.add(uniqueId);
                  return true;
              }),
          ];
      } else {
        const responseData = response.map((item) => ({
          ...item,
          id: item.id.toString(),
          }));
          
          const requestData = request;
          const seen = new Set(fetchData.map((item) => item.id));
          combinedData = [
              ...responseData,
              ...filteredRequest.filter((item) => {
                  const uniqueId = item["NO PROCESS ORDER"];
                  if (seen.has(uniqueId)) return false;
                  seen.add(uniqueId);
                  return true;
              }),
          ];
      }

      // Display or process combined data
      // console.log("Combined Data:", combinedData);
      return combinedData;
    } catch (error) {
      console.log(error);
    }
}

async function getAllPOShift(line, date_start, date_end) {
  try {
    console.log("Sent Data to the Backend for shift: ", line, date_start, date_end);
    const response = await fetch(`${URL.URL}/getAllPOShift`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ line, date_start, date_end }), 
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Retrieved Production Order: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getSpeedSKU(sku) {
  try {
    console.log("Sent data to the Backend to retrieve speed data: ", sku);
    const response = await fetch(`${URL.URL}/getSpeedSKU`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sku })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Retrieved Product Speed: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function updateTimeStamps(id, date, actual_start, actual_end, poStart, poEnd) {
  console.log("Received and sent data from serverless: ", id, date, actual_start, actual_end, poStart, poEnd);
  try {
    const response = await fetch(`${URL.URL}/updateStartEndPO`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, date, actual_start, actual_end, poStart, poEnd }),
    });

    if (!response.ok) {
      throw new Error('Failed to update production order');
    }

    const result = await response.json();
    return result.rowsAffected;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function updatePO(id, date, line, status, group, groupSelection) {
  console.log("Received and sent data: ", id, date, line, status, group, groupSelection);
  if (status === 'Release SAP') {
    try {
      const response = await fetch(`${URL.URL}/createPO`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: String(id), date, line, group }),
      });
  
      if (response.status === 400) {
        throw new Error('Production order already existed in another line');
      } else if (!response.ok) {
        throw new Error('Failed to update production order');
      }
  
      const result = await response.json();
      return result.rowsAffected;
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else {
    try {
      const response = await fetch(`${URL.URL}/updatePO`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, date, group, groupSelection }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update production order');
      }
  
      const result = await response.json();
      return result.rowsAffected;
    } catch (err) {
      console.error(err);
      throw err;
    } 
  }
}

async function getGroup(plant){
  try {
    const response = await fetch(`${URL.URL}/getAllGroup/${plant}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function insertPerformance(net, running, production, operation, nReported, available, breakdown, processwait, planned, ut, startTime, line, group){
  if (typeof startTime === "string" || startTime instanceof String) {
    startTime = new Date(startTime);
  }
  var oneJan = new Date(startTime.getFullYear(), 0, 1);
  var numberOfDays = Math.floor((startTime - oneJan) / (24 * 60 * 60 * 1000)  + 1);
  var weekNumber = Math.ceil(numberOfDays / 7);
  const date_week = weekNumber.toString();
  console.log("Received and sent data: ", net, running, production, operation, nReported, available, breakdown, processwait, planned, startTime, line, group);
  try {
    const response = await fetch(`${URL.URL}/insertPerformance`, {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({net, running, production, operation, nReported, available, breakdown, processwait, planned, ut, startTime, date_week, line, group}),
    });

    if (!response.ok) {
      throw new Error('Failed to update production order');
    }

    const result = await response.json();
    return result.rowsAffected;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { createEmptyPO, getPO, getPOLine, getAllPO, getAllPOShift, getSpeedSKU, updateTimeStamps, updatePO, getGroup, insertPerformance }