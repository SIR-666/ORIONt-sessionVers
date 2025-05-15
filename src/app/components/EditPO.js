import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

const Edit = (props) => {
  const [editOption, setEditOption] = useState("start");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [data, setData] = useState([]);
  const [group, setGroup] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const value = params.get("value");
  const { id, status } = props;
  useEffect(() => {
    // You can fetch the specific data if needed here using the `id`
    console.log(`Editing item with ID: ${props.id}`);
  }, [props.id]);

  const parseISOToLocal = (isoString) => {
    if (!isoString) {
      throw new Error("Invalid ISO string"); // Add a safety check
    }
    const [date, time] = isoString.split("T");
    if (!date || !time) {
      throw new Error(`Unexpected format for ISO string: ${isoString}`);
    }
    const [year, month, day] = date.split("-");
    const [hours, minutes, seconds] = time.split(":");
    if (!year || !month || !day || !hours || !minutes || !seconds) {
      throw new Error(
        `Invalid date or time components in ISO string: ${isoString}`
      );
    }

    return new Date(
      parseInt(year), // Year
      parseInt(month) - 1, // Month (0-based in JS Date)
      parseInt(day), // Day
      parseInt(hours), // Hours
      parseInt(minutes), // Minutes
      parseFloat(seconds) // Seconds
    );
  };

  useEffect(() => {
    // Function to format current date and time
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const now = new Date();
    const current = formatDateTime(now);

    let dataTime = localStorage.getItem("date");
    const shiftLocal = localStorage.getItem("shift");

    // If dataTime exists, format it to match 'current' format
    if (dataTime) {
      const parsedDate = new Date(dataTime);
      if (shiftLocal === "I") {
        dataTime = parsedDate.setHours(6, 0, 0, 0);
      } else if (shiftLocal === "II") {
        dataTime = parsedDate.setHours(14, 0, 0, 0);
      } else if (shiftLocal === "III") {
        dataTime = parsedDate.setHours(22, 0, 0, 0);
      }
      dataTime = formatDateTime(parsedDate);
    } else {
      dataTime = current; // Fallback if no date is in localStorage
    }

    setCurrentTime(current);
    if (!endDate) setEndDate(dataTime);
    if (!startDate) setStartDate(dataTime);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productionOrderRes = await fetch(`/api/getPObyId?id=${id}`);
        if (!productionOrderRes.ok) {
          throw new Error("Failed to fetch one or more data sources");
        }
        const productionData = await productionOrderRes.json();

        console.log(
          "Retrieved PO from backend in stop modal: ",
          productionData
        );

        const dataTime = localStorage.getItem("date");
        const shiftLocal = localStorage.getItem("shift");
        let parsedDate = new Date(dataTime);
        if (shiftLocal === "I") {
          parsedDate.setHours(6, 0, 0, 0);
        } else if (shiftLocal === "II") {
          parsedDate.setHours(14, 0, 0, 0);
        } else if (shiftLocal === "III") {
          parsedDate.setHours(22, 0, 0, 0);
        }

        let selectedIndex = 0;
        console.log("Shift Date: ", parsedDate);
        if (Array.isArray(productionData)) {
          for (let i = 0; i < productionData.length; i++) {
            const poStart = new Date(productionData[i].actual_start);
            poStart.setHours(poStart.getHours() - 7);
            if (poStart >= parsedDate) {
              selectedIndex = i;
              break;
            }
          }
        }
        console.log("Final value: ", selectedIndex);
        console.log("Selected PO: ", productionData[selectedIndex]);
        // setData(productionData[selectedIndex]);
        const selectedItem = productionData[selectedIndex];
        Object.entries(selectedItem).forEach(([key, value]) => {
          console.log(`Key: ${key}, Value: ${value}`);
          if (key === "group") {
            setGroup(value);
          } else if (key === "actual_start") {
            const dateStart = parseISOToLocal(value);
            setStartTime(value);
            console.log("PO start: ", value);
          } else if (key === "actual_end") {
            const dateEnd = parseISOToLocal(value);
            setEndTime(value);
            console.log("PO end: ", value);
          }
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error fetching PO data: " + error.message);
      }
    };

    if (id && value) {
      fetchData(); // Only fetch when `id` is available
    }
  }, [id, value]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === "actual_end") {
      const localDate = new Date(value); // Create Date object from local input
      const utcDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString(); // Convert to ISO format

      setEndDate(utcDate);
      console.log("New End Date: ", utcDate);
    } else if (id === "actual_start") {
      const localDate = new Date(value); // Create Date object from local input
      const utcDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString(); // Convert to ISO format

      setStartDate(utcDate);
      console.log("New Start Date: ", utcDate);
    }
  };

  const handleOptionChange = (e) => {
    setEditOption(e.target.value);
  };

  const handleSubmit = async () => {
    let time, timeStart, timeEnd;
    if (editOption === "start") {
      time = startDate;
    } else if (editOption === "end") {
      time = endDate;
    } else if (editOption === "both") {
      timeStart = startDate;
      timeEnd = endDate;
    }

    if (!id || !value) {
      alert("ID must be provided");
      return;
    }

    // if (time < startTime) {
    //   alert("End Time must be later than Start Time");
    // }

    const sortedData = [...props.data].sort(
      (a, b) => new Date(a.actual_start) - new Date(b.actual_start)
    );

    console.log("Sorted Data: ", sortedData);

    const currentIndex = sortedData.findIndex((po) => po.id === props.id);

    if (currentIndex === -1) {
      console.error("Current PO not found in sortedData.");
      return;
    }

    for (let i = currentIndex; i < sortedData.length; i++) {
      const currentPO = sortedData[i];
      const nextPO = sortedData[i + 1]; // Next PO (if exists)
      const prevPO = sortedData[i - 1]; // Previous PO (if exists)

      console.log("Current PO: ", currentPO);
      console.log("Next PO: ", nextPO);
      console.log("Previous PO: ", prevPO);

      if (editOption === "start") {
        if (prevPO && time <= prevPO.actual_end) {
          alert(
            "The new start time overlaps with the previous Production Order."
          );
          return;
        }
        break;
      } else if (editOption === "end") {
        if (time <= currentPO.actual_start) {
          alert("The new end time overlaps with an existing Production Order.");
          return;
        }
        if (
          time >= currentPO.actual_end &&
          (!nextPO || time < nextPO.actual_start)
        ) {
          // Valid gap found
          break;
        }
        if (nextPO && time > nextPO.actual_start) {
          alert("The new end time overlaps with the next Production Order.");
          return;
        }
      } else if (editOption === "both") {
        if (prevPO && timeStart <= prevPO.actual_end) {
          alert(
            "The new start time overlaps with the previous Production Order."
          );
          return;
        }
        // Check overlap for the end time with the current PO's start time
        if (timeEnd <= currentPO.actual_start) {
          alert("The new end time overlaps with the current Production Order.");
          return;
        }
        // Check for a valid gap before the next PO for the end time (if exists)
        if (
          timeEnd >= currentPO.actual_end &&
          (!nextPO || timeEnd < nextPO.actual_start)
        ) {
          // Valid start and end times
          break;
        }
        if (nextPO && timeEnd > nextPO.actual_start) {
          alert("The new end time overlaps with the next Production Order.");
          return;
        }
      }

      // Check if the new PO overlaps with the current PO's range
      //   if (endDate <= currentPO.actual_start) {
      //     alert("The new end time overlaps with an existing Production Order.");
      //     return;
      //   }

      // Check if the new PO fits within a valid gap
      //   if (
      //     endDate >= currentPO.actual_end &&
      //     (!nextPO || time < nextPO.actual_start)
      //   ) {
      //     // Valid gap found
      //     break;
      //   }

      //   if (
      //     currentPO.actual_end === null &&
      //     nextPO &&
      //     endDate >= nextPO.actual_start
      //   ) {
      //     alert("The new end time overlaps with the next Production Order.");
      //     return;
      //   }
    }

    setLoading(true);
    try {
      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (!["start", "end", "both"].includes(editOption)) {
        throw new Error("Invalid edit option selected");
      }

      let body;
      if (editOption === "start") {
        body = {
          id,
          date: time,
          line: value,
          status,
          group,
          actual_start: time,
          poStart: startTime,
          poEnd: endTime,
        };
      } else if (editOption === "end") {
        body = {
          id,
          date: time,
          line: value,
          status,
          group,
          actual_end: time,
          poStart: startTime,
          poEnd: endTime,
        };
      } else if (editOption === "both") {
        body = {
          id,
          date: endDate,
          line: value,
          status,
          group,
          actual_start: timeStart,
          actual_end: timeEnd,
          poStart: startTime,
          poEnd: endTime,
        };
      }

      console.log("Sent data: ", body);

      const response = await fetch("/api/updatePO", {
        ...fetchOptions,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update order";
        try {
          const errorResponse = await response.json();
          errorMessage = errorResponse.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      alert(`Production order updated successfully!`);
      props.onUpdate();
      props.setShowEdit(false);
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating order: " + error.message);
    } finally {
      setLoading(false);
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
                <h3 className="text-black font-semibold">
                  Edit Production Order {props.id}
                </h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={() => props.setShowEdit(false)}
                >
                  <span
                    className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                    style={{ backgroundColor: "#A3D9A5" }}
                  >
                    x
                  </span>
                </button>
              </div>
              <div className="relative p-6 flex-auto w-full flex flex-col">
                <div className="mb-4">
                  <label className="text-black font-bold mb-2">
                    Edit Option:
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="text-black">
                      <input
                        type="radio"
                        value="start"
                        checked={editOption === "start"}
                        onChange={handleOptionChange}
                      />
                      Start Time
                    </label>
                    <label className="text-black">
                      <input
                        type="radio"
                        value="end"
                        checked={editOption === "end"}
                        onChange={handleOptionChange}
                      />
                      End Time
                    </label>
                    {/* <label className="text-black">
                      <input
                        type="radio"
                        value="both"
                        checked={editOption === "both"}
                        onChange={handleOptionChange}
                      />
                      Start Time & End Time
                    </label> */}
                  </div>
                </div>
                {editOption === "start" || editOption === "both" ? (
                  <div className="grid grid-cols-2">
                    <div className="relative col-span-1 w-full flex flex-col h-full">
                      <h2 className="text-black mt-3">Start Time: </h2>
                    </div>
                    <div className="relative col-span-1 w-full flex flex-col h-full">
                      <input
                        type="datetime-local"
                        name="actual_start"
                        id="actual_start"
                        className="border border-gray-300 px-3 py-2 text-black"
                        value={startDate.slice(0, 16)}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : null}
                {editOption === "end" || editOption === "both" ? (
                  <div className="grid grid-cols-2">
                    <div className="relative col-span-1 w-full flex flex-col h-full">
                      <h2 className="text-black mt-3">End Time: </h2>
                    </div>
                    <div className="relative col-span-1 w-full flex flex-col h-full">
                      <input
                        type="datetime-local"
                        name="actual_end"
                        id="actual_end"
                        className="border border-gray-300 px-3 py-2 text-black"
                        value={endDate.slice(0, 16)}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  onClick={() => props.setShowEdit(false)}
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
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default Edit;
