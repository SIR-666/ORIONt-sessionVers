// const config = require("../db/config");
import URL from "./url";

async function createEmptyPO(data) {
  try {
    const { startTime, endTime, plant, line, groupSelection } = data;
    const date_start = new Date(startTime + "Z"); // Parse startTime to Date
    const date_end = new Date(endTime + "Z"); // Parse startTime to Date
    if (isNaN(date_start) || isNaN(date_end)) {
      throw new Error("Invalid date format for start or end time");
    }
    console.log("Sending data to createEmptyPO:", {
      date_start,
      date_end,
      plant,
      line,
      groupSelection,
    });
    const response = await fetch(`${URL.URL}/createEmptyPO`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date_start,
        date_end,
        plant,
        line,
        groupSelection,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create stoppage entry");
    }

    const result = await response.json();
    console.log("Result from createEmptyPO API:", result);
    return {
      rowsAffected: result.rowsAffected,
      message: result.message,
      id: result.id,
    }; // Return the response object, e.g., { message, id }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getPO(id) {
  try {
    const response = await fetch(`${URL.URL}/getPO/${id}`, {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching PO: ", error);
  }
}

async function getPOLine(line) {
  try {
    const response = await fetch(`${URL.URL}/getAllPOLine/${line}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching PO: ", error);
  }
}

async function getAllPO(line, year, month, shift, date, plant) {
  try {
    const sapUrl =
      plant === "Milk Processing"
        ? `${URL.URL}/getProcessingOrder?plant=${plant}`
        : plant === "Yogurt"
        ? `${URL.urlSAP}/${year}/${month}/YOGURT`
        : plant === "Cheese"
        ? `${URL.urlSAP}/${year}/${month}/MOZZ/RICOTTA`
        : `${URL.urlSAP}/${year}/${month}/GF%20MILK`;

    const [responseRes, requestRes, fetchRes] = await Promise.allSettled([
      fetch(`${URL.URL}/getAllPO/${line}/${shift}/${date}`, {
        cache: "no-store",
      }),
      fetch(sapUrl, { cache: "no-store" }),
      fetch(`${URL.URL}/getOrders`, { cache: "no-store" }),
    ]);

    const parseJSON = async (res) => {
      if (!res || res.status !== "fulfilled") return [];
      const response = res.value;
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) return [];
      return await response.json().catch(() => []);
    };

    const response = await parseJSON(responseRes);
    const request = await parseJSON(requestRes);
    const fetchData = await parseJSON(fetchRes);

    const filterMaterials = (data, line) => {
      if (["Line A", "Line B", "Line C", "Line D"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("ESL"));
      } else if (["Line E", "Line F", "Line G"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("UHT"));
      } else if (["Flex 1", "Flex 2", "GEA 5"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("ESL"));
      } else if (["GEA 3", "GEA 4"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("UHT"));
      } else if (["YA"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("125"));
      } else if (["YB"].includes(line)) {
        return data.filter(
          (item) =>
            item.MATERIAL?.includes("500") || item.MATERIAL?.includes("1000")
        );
      } else if (["YD (POUCH)"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("POUCH"));
      } else if (["YRTD"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("RTD"));
      } else if (["PASTEURIZER"].includes(line)) {
        return data.filter((item) => item.MATERIAL?.includes("SFP"));
      } else if (["RICO"].includes(line)) {
        return data.filter(
          (item) =>
            item.MATERIAL?.includes("RICOTTA") &&
            !item.MATERIAL?.includes("SFP")
        );
      } else if (["MOZ 200", "MOZ 1000"].includes(line)) {
        return data.filter(
          (item) =>
            item.MATERIAL?.includes("MOZZ") && !item.MATERIAL?.includes("SFP")
        );
      }
      return data;
    };

    const filteredRequest = filterMaterials(request, line);
    const seen = new Set(fetchData.map((item) => item.id));
    const combinedData = [
      ...response.map((item) => ({ ...item, id: item.id.toString() })),
      ...filteredRequest.filter((item) => {
        const id = item["NO PROCESS ORDER"];
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }),
    ];

    return combinedData;
  } catch (error) {
    console.error("Error fetching PO data:", error);
    return [];
  }
}

async function getAllPOShift(line, date_start, date_end) {
  try {
    console.log(
      "Sent Data to the Backend for shift: ",
      line,
      date_start,
      date_end
    );
    const response = await fetch(`${URL.URL}/getAllPOShift`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ line, date_start, date_end }),
      cache: "no-store",
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sku }),
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

async function updateTimeStamps(
  id,
  date,
  actual_start,
  actual_end,
  poStart,
  poEnd
) {
  console.log(
    "Received and sent data from serverless: ",
    id,
    date,
    actual_start,
    actual_end,
    poStart,
    poEnd
  );
  try {
    const response = await fetch(`${URL.URL}/updateStartEndPO`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        date,
        actual_start,
        actual_end,
        poStart,
        poEnd,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update production order");
    }

    const result = await response.json();
    return result.rowsAffected;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function updatePO(id, date, line, status, group, groupSelection, plant) {
  console.log(
    "Received and sent data: ",
    id,
    date,
    line,
    status,
    group,
    groupSelection,
    plant
  );
  if (status === "Release SAP" || status === "Release") {
    try {
      const response = await fetch(`${URL.URL}/createPO`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: String(id), date, line, group, plant }),
      });

      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      } else if (!response.ok) {
        throw new Error("Failed to update production order");
      }

      const result = await response.json();
      return { rowsAffected: result.rowsAffected, id: result.id };
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else {
    try {
      const response = await fetch(`${URL.URL}/updatePO`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, date, group, groupSelection }),
      });

      if (!response.ok) {
        throw new Error("Failed to update production order");
      }

      const result = await response.json();
      return result.rowsAffected;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

async function getGroup(plant) {
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

async function insertPerformance(
  net,
  running,
  production,
  operation,
  nReported,
  available,
  breakdown,
  processwait,
  planned,
  ut,
  startTime,
  line,
  group,
  plant
) {
  if (typeof startTime === "string" || startTime instanceof String) {
    startTime = new Date(startTime);
  }
  var oneJan = new Date(startTime.getFullYear(), 0, 1);
  var numberOfDays = Math.floor(
    (startTime - oneJan) / (24 * 60 * 60 * 1000) + 1
  );
  var weekNumber = Math.ceil(numberOfDays / 7);
  const date_week = weekNumber.toString();
  console.log(
    "Received and sent data: ",
    net,
    running,
    production,
    operation,
    nReported,
    available,
    breakdown,
    processwait,
    planned,
    startTime,
    line,
    group,
    plant
  );
  try {
    const response = await fetch(`${URL.URL}/insertPerformance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        net,
        running,
        production,
        operation,
        nReported,
        available,
        breakdown,
        processwait,
        planned,
        ut,
        startTime,
        date_week,
        line,
        group,
        plant,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update production order");
    }

    const result = await response.json();
    return result.rowsAffected;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  createEmptyPO,
  getPO,
  getPOLine,
  getAllPO,
  getAllPOShift,
  getSpeedSKU,
  updateTimeStamps,
  updatePO,
  getGroup,
  insertPerformance,
};
