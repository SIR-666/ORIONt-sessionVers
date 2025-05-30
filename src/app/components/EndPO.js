import { getShift } from "@/utils/getShift";
import moment from "moment";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

const End = (props) => {
  const [time, setTime] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isEndTimeValid, setIsEndTimeValid] = useState(true);
  const [data, setData] = useState([]);
  const [shiftBoxes, setShiftBoxes] = useState([]);
  const [group, setGroup] = useState("");
  const [groupSelection, setGroupSelection] = useState({});
  const [groupData, setGroupData] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [startISO, setStartISO] = useState("");
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

    let dataTime = sessionStorage.getItem("date");
    const shiftLocal = sessionStorage.getItem("shift");

    // If dataTime exists, format it to match 'current' format
    if (dataTime) {
      const parsedDate = new Date(dataTime);
      if (shiftLocal === "II") {
        dataTime = parsedDate.setHours(14, 0, 0, 0);
      } else if (shiftLocal === "III") {
        dataTime = parsedDate.setHours(22, 0, 0, 0);
      }
      dataTime = formatDateTime(parsedDate);
    } else {
      dataTime = current; // Fallback if no date is in sessionStorage
    }

    setCurrentTime(current);
    if (!time) setTime(dataTime);
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
        setData(productionData[0]);

        productionData.forEach((element) => {
          setGroup(element.group);
          setStartISO(element.actual_start);
          console.log("actual_startISO: ", element.actual_start);
          const dateStart = parseISOToLocal(element.actual_start);
          console.log("actual_start: ", dateStart);
          setStartTime(dateStart);
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

  const plant = sessionStorage.getItem("plant");

  useEffect(() => {
    const getGroup = async () => {
      try {
        const response = await fetch(`/api/getGroup?plant=${plant}`);
        const data = await response.json();
        console.log("Fetched groups: ", data);
        setGroupData(data);
      } catch (error) {
        console.error("Error:", error);
        alert("Error getting data: " + error.message);
      }
    };

    getGroup();
  }, []);

  const calculateShifts = (startTime, endTime) => {
    const shifts = [
      { start: "06:00", end: "14:00" }, // Shift I
      { start: "14:00", end: "22:00" }, // Shift II
      { start: "22:00", end: "06:00" }, // Shift III (next day)
    ];

    const start = new Date(startTime);
    const end = new Date(endTime);
    end.setHours(end.getHours() - 7);

    console.log("Start PO: ", start);
    console.log("End PO: ", end);

    if (start >= end) {
      // alert("End time must be later than start time.");
      setShiftBoxes([]);
      return;
    }

    const boxes = [];
    let current = new Date(start);

    while (current < end) {
      for (let i = 0; i < shifts.length; i++) {
        const shift = shifts[i];
        const shiftStart = new Date(current);
        const shiftEnd = new Date(current);

        const [startHour, startMinute] = shift.start.split(":").map(Number);
        const [endHour, endMinute] = shift.end.split(":").map(Number);

        shiftStart.setHours(startHour, startMinute, 0, 0);
        if (endHour < startHour) {
          // Handles shifts ending the next day
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }
        shiftEnd.setHours(endHour, endMinute, 0, 0);

        // Check if the order crosses into this shift
        if (start < shiftEnd && end > shiftStart && start < shiftStart) {
          if (
            !boxes.find((box) => box.start.getTime() === shiftStart.getTime())
          ) {
            boxes.push({
              shift: `Shift ${i + 1}`,
              start: new Date(shiftStart),
              end: new Date(shiftEnd),
            });
          }
        }

        // Update the `current` pointer
        current = new Date(shiftEnd);
      }
    }

    setShiftBoxes(boxes);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    let endTime;
    if (id === "actual_end") {
      const localDate = new Date(value); // Create Date object from local input
      const utcDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString(); // Convert to ISO format

      endTime = utcDate;
      setTime(utcDate);
      console.log("New Date: ", utcDate);
    }

    // Cek if end time is later than current time
    const now = new Date();
    const nowUTC = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const endTimeDate = new Date(endTime);
    if (endTimeDate > nowUTC) {
      setIsEndTimeValid(false);
    } else {
      setIsEndTimeValid(true);
    }

    if (startTime && endTime) {
      calculateShifts(startTime, endTime);
    }
  };

  const handleGroupChange = (shiftIndex, selectedGroup) => {
    setGroupSelection((prevSelections) => ({
      ...prevSelections,
      [shiftIndex]: selectedGroup, // Update only the group for the specific shift
    }));
  };

  const handleSubmit = async () => {
    if (!id || !time || !value) {
      alert("ID, date, and time must be provided");
      return;
    }

    if (time < startISO) {
      alert("End Time must be later than Start Time");
      return;
    }

    // ===== VALIDASI SHIFT TIME SESUAI SHIFT =====
    try {
      const shift = sessionStorage.getItem("shift");
      let shiftDate = moment.utc(startISO).format("YYYY-MM-DD");
      const parsedEnd = moment(time).subtract(7, "hours").toDate(); // Convert UTC to WIB

      // Untuk shift 3, jika input waktu masih pagi (00:00–05:59), artinya termasuk shift semalam
      // if (shift === "III") {
      //   const inputHour = moment.utc(time).hour(); // UTC jam
      //   if (inputHour < 6) {
      //     shiftDate = moment
      //       .utc(startISO)
      //       .subtract(1, "day")
      //       .format("YYYY-MM-DD");
      //   }
      // }

      if (!shift || !shiftDate || isNaN(parsedEnd)) {
        alert("Shift atau tanggal tidak valid.");
        return;
      }

      const { startTime: shiftStart, endTime: shiftEnd } = getShift(
        shift,
        new Date(shiftDate)
      );
      console.log("end time : ", parsedEnd);
      console.log("shift start : ", shiftStart);
      console.log("shift end : ", shiftEnd);

      if (parsedEnd < shiftStart || parsedEnd > shiftEnd) {
        const shiftLabel =
          shift === "I"
            ? "06:00–14:00"
            : shift === "II"
            ? "14:00–22:00"
            : "22:00–06:00 (next day)";
        alert(
          `End time must be within ${shiftDate} shift ${shift} ${shiftLabel}`
        );
        return;
      }
    } catch (err) {
      console.error("Shift validation error:", err);
      alert("Terjadi kesalahan saat validasi waktu shift.");
      return;
    }

    const sortedData = [...props.data].sort(
      (a, b) => new Date(a.actual_start) - new Date(b.actual_start)
    );

    for (let i = 0; i < sortedData.length; i++) {
      const currentPO = sortedData[i];
      const nextPO = sortedData[i + 1]; // Next PO (if exists)

      console.log("Current PO: ", currentPO);
      console.log("Next PO: ", nextPO);

      // Check if the new PO overlaps with the current PO's range
      if (
        time >= currentPO.actual_start &&
        time < currentPO.actual_end &&
        currentPO.status !== "Active"
      ) {
        alert("The new end time overlaps with an existing Production Order.");
        return;
      }

      // Check if the new PO fits within a valid gap
      if (
        time >= currentPO.actual_end &&
        (!nextPO || time < nextPO.actual_start)
      ) {
        break; // Valid gap found
      }

      if (
        currentPO.actual_end === null &&
        nextPO &&
        time > nextPO.actual_start
      ) {
        alert("The new end time overlaps with the next Production Order.");
        return;
      }
    }

    const userConfirmed = window.confirm(
      `Are you sure the inputted end time is correct?`
    );

    if (userConfirmed) {
      console.log("Sent data: ", id, time, value, group, groupSelection);
      setLoading(true);
      try {
        const response = await fetch("/api/updatePO", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            date: time,
            line: value,
            status,
            group,
            groupSelection,
          }),
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.error || "Failed to update order");
        }

        const data = await response.json();
        alert("Production order stopped successfully!");
        props.onUpdate();
        props.setShowEnd(false);
      } catch (error) {
        console.error("Error:", error);
        alert("Error updating order: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Submission canceled by user");
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
                <h3 className="text-black font-semibold">Set End Time</h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={() => props.setShowEnd(false)}
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
                <div className="grid grid-cols-2">
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    {/* <h2 className="text-black mt-3">Start Time: </h2> */}
                    <h2 className="text-black mt-3">End Time: </h2>
                  </div>
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    {/* <h2 className="text-black mt-3">{new Date(startTime)}</h2> */}
                    <input
                      type="datetime-local"
                      name="actual_end"
                      id="actual_end"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={time.slice(0, 16)}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  {/* <h4 className="text-black font-semibold">Crossed Shifts:</h4> */}
                  {shiftBoxes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shiftBoxes.map((box, index) => (
                        <div
                          key={index}
                          className="text-white px-4 py-2 rounded shadow"
                        >
                          <select
                            id="group"
                            className="text-black rounded-lg border border-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 mt-2 ml-0"
                            value={groupSelection[index] || ""}
                            onChange={(event) =>
                              handleGroupChange(index, event.target.value)
                            }
                          >
                            <option value="">Group</option>
                            {groupData && groupData.length > 0 ? (
                              groupData.map((item, index) => (
                                <option key={index} value={item.group}>
                                  {item.group}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                No groups available
                              </option>
                            )}
                          </select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No shifts crossed.</p>
                  )}
                </div>
                {!isEndTimeValid && (
                  <p className="text-red-500 text-sm mt-2">
                    End time cannot be later than current time.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  onClick={() => props.setShowEnd(false)}
                >
                  Cancel
                </button>
                <button
                  className={`text-white ${
                    loading || !isEndTimeValid
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 active:bg-yellow-700"
                  } font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1`}
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isEndTimeValid}
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

export default End;
