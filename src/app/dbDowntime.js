import URL from "./url";

async function createStoppage(data) {
  try {
    const {
      machine,
      code,
      startTime,
      endTime,
      duration,
      comments,
      shift,
      line,
      type,
      group,
      plant,
    } = data;
    const date_start = new Date(startTime + "Z"); // Parse startTime to Date
    const date_end = new Date(endTime + "Z"); // Parse startTime to Date
    if (isNaN(date_start) || isNaN(date_end)) {
      throw new Error("Invalid date format for start or end time");
    }
    const date_month = date_start.toLocaleString("default", {
      month: "numeric",
    }); // Get month name
    var oneJan = new Date(date_start.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (date_start - oneJan) / (24 * 60 * 60 * 1000)
    );

    // -- Old Code --
    // var weekNumber = Math.ceil((date_start.getDay() + 1 + numberOfDays) / 7);
    // -- End of Old Code --

    // -- New Code --
    function getWeekNumber(date) {
      let year = date.getFullYear();
      let firstSunday = new Date(year, 0, 1); // 1 Januari tahun ini

      // Geser ke hari Minggu pertama dalam tahun ini
      while (firstSunday.getDay() !== 0) {
        firstSunday.setDate(firstSunday.getDate() + 1);
      }

      // Hitung jumlah hari sejak Minggu pertama tahun ini
      let diffDays = Math.floor((date - firstSunday) / (24 * 60 * 60 * 1000));

      // Hitung minggu ke-berapa (dimulai dari 1)
      return Math.floor(diffDays / 7) + 1;
    }

    // Penggunaan:
    let date = new Date(date_start);
    var weekNumber = getWeekNumber(date);
    console.log("Minggu ke:", getWeekNumber(date));
    // -- End of New Code --

    const date_week = weekNumber.toString();
    console.log("Sending data to createStoppage:", {
      date_start,
      date_end,
      date_month,
      date_week,
      machine,
      code,
      duration,
      comments,
      shift,
      line,
      type,
      group,
      plant,
    });
    const response = await fetch(`${URL.URL}/createStoppage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date_start,
        date_end,
        date_month,
        date_week,
        shift,
        line,
        type,
        machine,
        code,
        comments,
        duration,
        group,
        plant,
      }),
    });

    if (response.status === 409) {
      const errorData = await response.json();
      return { error: errorData.message };
    }

    if (!response.ok) {
      throw new Error("Failed to create stoppage entry");
    }

    const result = await response.json();
    console.log("Result from createStoppage API:", result);
    return {
      machine,
      code,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      comments: comments,
      type: type,
      shift: shift,
      id: result.id,
    }; // Return the response object, e.g., { message, id }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateStoppage(data) {
  try {
    const {
      id,
      machine,
      code,
      startTime,
      endTime,
      duration,
      comments,
      shift,
      line,
      type,
      plant,
    } = data;
    const date_start = new Date(startTime + "Z"); // Parse startTime to Date
    const date_end = new Date(endTime + "Z"); // Parse startTime to Date
    if (isNaN(date_start) || isNaN(date_end)) {
      throw new Error("Invalid date format for start or end time");
    }
    const date_month = date_start.toLocaleString("default", {
      month: "numeric",
    }); // Get month name
    var oneJan = new Date(date_start.getFullYear(), 0, 1);
    var numberOfDays = Math.floor(
      (date_start - oneJan) / (24 * 60 * 60 * 1000)
    );
    var weekNumber = Math.ceil((date_start.getDay() + 1 + numberOfDays) / 7);
    const date_week = weekNumber.toString();
    console.log("Sending data to updateStoppage:", {
      id,
      date_start,
      date_end,
      date_month,
      date_week,
      machine,
      code,
      duration,
      comments,
      shift,
      line,
      type,
      plant,
    });
    const response = await fetch(`${URL.URL}/updateStoppage`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        date_start,
        date_end,
        date_month,
        date_week,
        shift,
        line,
        type,
        machine,
        code,
        comments,
        duration,
        plant,
      }),
    });

    if (response.status === 409) {
      const errorData = await response.json();
      return { error: errorData.message };
    }

    if (!response.ok) {
      throw new Error("Failed to update stoppage entry");
    }

    const result = await response.json();
    console.log("Result from updateStoppage API:", result);
    return {
      machine,
      code,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      comments: comments,
      type: type,
      shift: shift,
      id: result.id,
      plant: plant,
    }; // Return the response object, e.g., { message, id }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getAllStoppages(line, date_start, date_end, plant) {
  try {
    console.log("Sending data to getAllStoppages:", {
      line,
      date_start,
      date_end,
      plant,
    });
    const response = await fetch(`${URL.URL}/getAllStoppages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
        plant,
      }),
    });
    const data = await response.json();
    // console.log("Retrieved Response: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getDowntimePO(date_start, date_end, line) {
  try {
    const response = await fetch(`${URL.URL}/getDowntime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date_start,
        date_end,
        line,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Downtime PO: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getDowntimeCategory() {
  try {
    const response = await fetch(`${URL.URL}/getDowntimeCategory`);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getDowntimeType(type, line) {
  try {
    const response = await fetch(
      `${URL.URL}/getDowntimeType/${encodeURIComponent(type)}/${line}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getDowntimeId(id) {
  // console.log("Received id from serverless: ", id);
  try {
    const response = await fetch(`${URL.URL}/getDowntimeId/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function deleteDowntime(id, plant) {
  try {
    const response = await fetch(`${URL.URL}/deleteStoppage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, plant }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete stoppage entry");
    }

    const result = await response.json();
    console.log("Deleted Data: ", result);
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function insertQualityLoss(
  filling,
  packing,
  sample,
  quality,
  line,
  startTime,
  group,
  plant
) {
  console.log(
    "Received Data from serverless: ",
    filling,
    packing,
    sample,
    quality,
    line,
    startTime,
    group,
    plant
  );
  if (typeof startTime === "string" || startTime instanceof String) {
    startTime = new Date(startTime);
  }
  var oneJan = new Date(startTime.getFullYear(), 0, 1);
  var numberOfDays = Math.floor(
    (startTime - oneJan) / (24 * 60 * 60 * 1000) + 1
  );
  var weekNumber = Math.ceil(numberOfDays / 7);
  const date_week = weekNumber.toString();
  try {
    console.log(
      "Sending data to backend",
      filling,
      packing,
      sample,
      quality,
      line,
      startTime,
      date_week,
      group,
      plant
    );
    const response = await fetch(`${URL.URL}/insertQualLoss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filling,
        packing,
        sample,
        quality,
        line,
        startTime,
        date_week,
        group,
        plant,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create quality loss entry");
    }

    const result = await response.json();
    console.log("Result from createQualityLoss API:", result);
    return {
      quality,
      line,
      startTime,
      date_week,
    };
  } catch (error) {
    console.log("Error inserting quality loss: ", error);
    throw error;
  }
}

async function insertSpeedLoss(speed, nominal, line, startTime, group, plant) {
  console.log(
    "Received Data from serverless: ",
    speed,
    nominal,
    line,
    startTime,
    group,
    plant
  );
  if (typeof startTime === "string" || startTime instanceof String) {
    startTime = new Date(startTime);
  }
  var oneJan = new Date(startTime.getFullYear(), 0, 1);
  var numberOfDays = Math.floor(
    (startTime - oneJan) / (24 * 60 * 60 * 1000) + 1
  );
  var weekNumber = Math.ceil(numberOfDays / 7);
  const date_week = weekNumber.toString();
  try {
    const response = await fetch(`${URL.URL}/insertSpeedLoss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        speed,
        nominal,
        line,
        startTime,
        date_week,
        group,
        plant,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create stoppage entry");
    }

    const result = await response.json();
    console.log("Result from createSpeedLoss API:", result);
    return {
      speed,
      line,
      startTime,
      date_week,
    };
  } catch (error) {
    console.log("Error inserting speed loss: ", error);
    throw error;
  }
}

async function deleteSpeedLoss(startTime, line) {
  console.log("Received data from serverless:", startTime, line);
  try {
    const response = await fetch(`${URL.URL}/deleteSpeedLoss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startTime, line }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete speed loss");
    }

    const result = await response.json();
    console.log("Deleted Data: ", result);
    return result;
  } catch (error) {
    console.log("Error deleting speed loss: ", error);
    throw error;
  }
}

async function insertQuantity(qty, line, startTime, group, plant) {
  console.log(
    "Received Data from serverless: ",
    qty,
    line,
    startTime,
    group,
    plant
  );
  if (typeof startTime === "string" || startTime instanceof String) {
    startTime = new Date(startTime);
  }
  var oneJan = new Date(startTime.getFullYear(), 0, 1);
  var numberOfDays = Math.floor(
    (startTime - oneJan) / (24 * 60 * 60 * 1000) + 1
  );
  var weekNumber = Math.ceil(numberOfDays / 7);
  const date_week = weekNumber.toString();
  try {
    const response = await fetch(`${URL.URL}/insertQuantity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qty,
        line,
        startTime,
        date_week,
        group,
        plant,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create stoppage entry");
    }

    const result = await response.json();
    console.log("Result from createSpeedLoss API:", result);
    return {
      qty,
      line,
      startTime,
      date_week,
      plant,
    };
  } catch (error) {
    console.log("Error inserting quantity: ", error);
    throw error;
  }
}

async function getQualityLoss(line, date_start, date_end, plant) {
  try {
    const response = await fetch(`${URL.URL}/getQualityLoss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
        plant,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Quality Loss: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getRejectSample(line, date_start, date_end, plant) {
  try {
    const response = await fetch(`${URL.URL}/getRejectSample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
        plant,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Quality Loss former: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getSpeedLoss(line, date_start, date_end, plant) {
  try {
    const response = await fetch(`${URL.URL}/getSpeedLoss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
        plant,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Speed Loss: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getNominalSpeed(line, date_start, date_end) {
  console.log("Received Data from serverless: ", line, date_start, date_end);
  try {
    const response = await fetch(`${URL.URL}/getNominalSpeed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Nominal Speed: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

async function getQuantity(line, date_start, date_end, plant) {
  try {
    const response = await fetch(`${URL.URL}/getQuantity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line,
        date_start,
        date_end,
        plant,
      }),
    });

    const data = await response.json();
    console.log("Retrieved Quantity: ", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  createStoppage,
  updateStoppage,
  getAllStoppages,
  getDowntimePO,
  getDowntimeCategory,
  getDowntimeType,
  getDowntimeId,
  deleteDowntime,
  insertSpeedLoss,
  deleteSpeedLoss,
  insertQualityLoss,
  insertQuantity,
  getQualityLoss,
  getRejectSample,
  getSpeedLoss,
  getNominalSpeed,
  getQuantity,
};
