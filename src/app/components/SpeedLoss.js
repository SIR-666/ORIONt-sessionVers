import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";
import nominalSpeeds from "../speed";

const Speed = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [speed, setSpeed] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [group, setGroup] = useState("");
  const [speedData, setSpeedData] = useState([]);
  const [lossSpeed, setLossSpeed] = useState([]);
  const [skuSpeed, setSKUSpeed] = useState(null);
  const [sku, setSKU] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingItems, setDeletingItems] = useState({});
  const params = useSearchParams();
  const value = params.get("value");
  const id = params.get("id");
  const shift = localStorage.getItem("shift");
  const date = localStorage.getItem("date");
  const plant = localStorage.getItem("plant");

  const formattedLineName = value.replace(/\s+/g, "_").toUpperCase();

  // Access the nominal speed from the map
  const nominalSpeed = nominalSpeeds[formattedLineName];

  function getLocalISOString() {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000; // Convert offset to milliseconds
    const localISOTime = new Date(now - tzOffsetMs).toISOString().slice(0, -1); // Remove Z at the end

    return `${localISOTime}Z`; // Append Z to denote ISO 8601 format
  }

  const getShift = (shift, date) => {
    if (!date || isNaN(new Date(date))) {
      console.error("Invalid date provided.");
      return null;
    }
    let startTime, endTime;
    switch (shift) {
      case "I":
        startTime = new Date(date);
        startTime.setHours(6, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(14, 0, 0, 0);
        break;
      case "II":
        startTime = new Date(date);
        startTime.setHours(14, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(22, 0, 0, 0);
        break;
      case "III":
        startTime = new Date(date);
        startTime.setHours(22, 0, 0, 0);
        endTime = new Date(date);
        endTime.setDate(endTime.getDate() + 1); // Move to the next day
        endTime.setHours(6, 0, 0, 0);
        break;
      default:
        console.warn("Invalid shift provided.");
        return null; // Handle invalid shift
    }
    console.log("Shift start time: ", startTime);
    console.log("Shift end time: ", endTime);

    return { startTime, endTime };
  };

  function toLocalISO(date) {
    const localDate = new Date(date);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");
    const seconds = String(localDate.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productionOrderRes = await fetch(`/api/getPObyId?id=${id}`);

        if (!productionOrderRes.ok) {
          throw new Error("Failed to fetch one or more speed loss data");
        }

        const productionData = await productionOrderRes.json();
        console.log("Retrieved Data: ", productionData);

        // Sort and set the production order data
        setData(productionData[0]);

        productionData.forEach(async (element) => {
          const getShiftTimes = getShift(shift, date);
          let startTime, endTime;

          const start = new Date(element.actual_start);
          start.setHours(start.getHours() - 7);
          const end = element.actual_end
            ? new Date(element.actual_end)
            : new Date();

          if (element.actual_end) {
            end.setHours(end.getHours() - 7);
          }

          startTime =
            start < getShiftTimes.startTime ? getShiftTimes.startTime : start;
          endTime = end < getShiftTimes.endTime ? end : getShiftTimes.endTime;
          const res = await fetch("/api/getNominalSpeed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              line: value,
              date_start: toLocalISO(startTime),
              date_end: toLocalISO(endTime) || getLocalISOString(),
              plant: plant,
            }),
          });

          const speedRes = await fetch("/api/getSpeedLoss", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              line: value,
              date_start: toLocalISO(startTime),
              date_end: toLocalISO(endTime) || getLocalISOString(),
              plant: plant,
            }),
          });

          if (!res.ok || !speedRes.ok) {
            throw new Error("Failed to fetch speed loss data");
          }

          const speedData = await res.json();
          if (Array.isArray(speedData) && speedData.length > 0) {
            setSpeedData(speedData);
            console.log("Speed Data:", speedData);
          }

          const lossSpeedData = await speedRes.json();
          if (Array.isArray(lossSpeedData) && lossSpeedData.length > 0) {
            setLossSpeed(lossSpeedData);
            console.log("Speed Loss Data:", lossSpeedData);
          }

          setGroup(element.group);
          setSKU(element.sku);
        });
      } catch {
        console.error("Error fetching data:", error);
        alert("Error fetching speed loss data: " + error.message);
      }
    };

    if (id && value) {
      fetchData(); // Only fetch when `id` is available
    }
  }, [id, value]);

  useEffect(() => {
    const getSpeed = async () => {
      let speed;

      if (sku !== "") {
        try {
          const speeds = [];
          const response = await fetch(`/api/getSpeedSKU`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sku: sku }),
          });

          const skuData = await response.json();
          console.log("Speed data: ", skuData[0].speed);
          if (skuData && typeof skuData[0].speed === "number") {
            speeds.push(skuData[0].speed); // Push valid speed values only
          } else {
            console.warn(`No speed found for SKU ${sku}`);
          }

          // Use the first valid speed found or fallback to the nominal speed
          speed =
            speeds.length > 0 ? speeds[0] : nominalSpeeds[formattedLineName];
        } catch (error) {
          console.error("Error fetching SKU nominal speed:", error);
          speed = null;
        }
      } else {
        speed = nominalSpeeds[formattedLineName];
      }

      console.log("Final speed returned:", speed);
      setSKUSpeed(speed); // Set the final speed in the state
    };

    // Trigger speed calculation when SKU changes
    if (sku) {
      getSpeed();
    }
  }, [sku, formattedLineName]);

  useEffect(() => {
    // Function to format current date and time
    const getCurrentDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartTime(getCurrentDateTime()); // Set the current date and time
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
      return "";
    }
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);
    return `${date.getUTCDate().toString().padStart(2, "0")}.${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getUTCFullYear()} ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === "startTime") {
      const localDate = new Date(value); // Create Date object from local input
      const utcDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString(); // Convert to ISO format

      setStartTime(utcDate);
      console.log("New Start Date: ", utcDate);
    } else if (id === "endTime") {
      const localDate = new Date(value); // Create Date object from local input
      const utcDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString(); // Convert to ISO format

      setEndTime(utcDate);
      console.log("New End Date: ", utcDate);
    }
  };

  const handleSpeedChange = (event) => {
    const value = event.target.value;
    // Optional: Validate that quantity is non-negative
    if (value >= 0 || value === "") {
      setSpeed(value);
    }
  };

  const calculateDifference = (start, end) => {
    const startDate = new Date(start);
    console.log("Start Time:", startDate);

    const endDate = new Date(end);
    console.log("End Time: ", endDate);

    const diffInMs = endDate - startDate;

    // Convert milliseconds to minutes
    const diffInHours = (diffInMs / (1000 * 60 * 60)).toFixed(4);

    console.log("Time Difference: ", diffInHours);
    return parseFloat(diffInHours);
  };

  const handleEdit = (date, speed) => {
    const localDate = new Date(date); // Create Date object from local input
    console.log("Local Date: ", localDate);
    const utcDate = new Date(localDate).toISOString(); // Convert to ISO format

    setStartTime(utcDate);
    setSpeed(speed);
  };

  const handleDelete = async (date) => {
    try {
      setDeletingItems((prevState) => ({
        ...prevState,
        [date]: true, // Mark the item as being deleted
      }));
      const response = await fetch(`/api/deleteSpeedLoss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startTime: date, line: value, plant: plant }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to update order");
      }

      const result = await response.json();
      if (result.success && result.rowsAffected > 0) {
        alert(`Deleted stoppage: ${result.rowsAffected} row(s) affected`);
      } else {
        alert("No rows were deleted");
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete speed loss");
    } finally {
      setDeletingItems((prevState) => ({
        ...prevState,
        [date]: false, // Mark the item as being deleted
      }));
    }
  };

  const handleSubmit = async () => {
    if (endTime < startTime) {
      alert("End Time must be later than Start Time");
      return;
    }
    // if (startTime < data.actual_start) {
    //   alert("Start Time must be later than PO Start Time");
    //   return;
    // }

    // if (startTime > data.actual_end || startTime > getLocalISOString()) {
    //   alert("Start Time must be within PO time range");
    //   return;
    // }

    if (!group) {
      alert("Please provide a group name");
      return;
    }

    const userConfirmed = window.confirm(
      `Are you sure the submitted data is correct?`
    );

    if (userConfirmed) {
      const timeDifference = calculateDifference(startTime, endTime);
      console.log("Hour Difference: ", timeDifference);

      console.log("Speed: ", skuSpeed);
      const actualSpeed =
        (((skuSpeed || nominalSpeed) - parseInt(speed)) /
          (skuSpeed || nominalSpeed)) *
        timeDifference;
      console.log("Speed Loss: ", actualSpeed);

      setLoading(true);
      try {
        const response = await fetch("/api/createSpeedLoss", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            speed: actualSpeed || 0,
            nominal: speed,
            value: value,
            startTime: startTime,
            group: group,
            plant: plant,
          }),
        });
        if (response.ok) {
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error("Error submitting speed loss data:", error);
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Submission cancelled by user");
    }
  };

  return (
    <>
      <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <Draggable>
          <div className="relative w-auto my-6 mx-auto max-w-3xl">
            <div className="border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
              <div
                className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-2xl"
                style={{ backgroundColor: "#A3D9A5" }}
              >
                <h3 className="text-black font-semibold">Set Speed Loss</h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={onClose}
                >
                  <span
                    className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                    style={{ backgroundColor: "#A3D9A5" }}
                  >
                    x
                  </span>
                </button>
              </div>
              <table className="w-full border-collapse min-w-full table-auto">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3 px-6">
                      Tanggal
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Loss Data
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Actual Speed (pcs/hr)
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {speedData.map((item, index) => {
                    const matchedLoss = lossSpeed.find(
                      (loss) => loss.Tanggal === item.Tanggal
                    );

                    return (
                      <tr className="bg-white border-b" key={index}>
                        <td className="py-4 px-6 text-black text-center">
                          {formatDateTime(item.Tanggal)}
                        </td>
                        <td className="py-4 px-6 text-black text-center">
                          {parseFloat(matchedLoss?.Downtime * 60).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-black text-center">
                          {item.Downtime}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {deletingItems[item.Tanggal] ? (
                            <span>Deleting...</span>
                          ) : (
                            <>
                              <button
                                className="text-yellow-500 hover:underline mr-3"
                                onClick={() =>
                                  handleEdit(item.Tanggal, item.Downtime)
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                  />
                                </svg>
                              </button>
                              <button
                                className="text-red-500 hover:underline"
                                onClick={() => handleDelete(item.Tanggal)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="relative p-6 flex-auto w-full flex flex-col">
                <div className="grid grid-cols-2">
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    <h2 className="text-black mt-3">Start Time: </h2>
                    <br></br>
                    <h2 className="text-black mt-4">End Time: </h2>
                    <br></br>
                    <h2 className="text-black mt-5">Actual Speed (pcs/hr): </h2>
                  </div>
                  <div className="relative col-span-1 flex flex-col h-full">
                    <input
                      type="datetime-local"
                      name="startTime"
                      id="startTime"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={startTime.slice(0, 16)}
                      onChange={handleInputChange}
                    />
                    <br></br>
                    <input
                      type="datetime-local"
                      name="endTime"
                      id="endTime"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={endTime.slice(0, 16)}
                      onChange={handleInputChange}
                    />
                    <br></br>
                    <input
                      type="number"
                      name="speedLoss"
                      id="speedLoss"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={speed}
                      onChange={handleSpeedChange}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  //add onclick for save default option
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className={`text-white ${
                    loading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 active:bg-yellow-700"
                  } font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1`}
                  type="button"
                  //add onclick for save default option
                  onClick={handleSubmit} //nanti diganti ke metode submit (connect ke backend)
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default Speed;
