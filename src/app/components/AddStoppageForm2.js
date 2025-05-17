import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

const FormFill2 = (props) => {
  const [newEntry, setNewEntry] = useState({
    machine: "",
    code: "",
    startTime: "",
    endTime: "",
    duration: 0,
    comments: "",
    shift: "",
    line: "",
    type: "",
  });
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationData, setDurationData] = useState("");
  const [minuteDifference, setMinutesDifference] = useState(0);
  const params = useSearchParams();
  const value = params.get("value");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, isLoading] = useState(false);
  const [id, setId] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  const options = {
    high: [{ id: "breakdown", value: "Breakdown", label: "Breakdown" }],
    low: [{ id: "minor", value: "Minor Stop", label: "Minor Stop" }],
    special: [
      { id: "plannedStop", value: "Planned Stop", label: "Planned Stop" },
      {
        id: "processWaiting",
        value: "Process Waiting",
        label: "Process Waiting",
      },
      {
        id: "unavailableTime",
        value: "Unavailable Time",
        label: "Unavailable Time",
      },
      {
        id: "processFailure",
        value: "Process Failure",
        label: "Process Failure",
      },
    ],
  };

  const threshold = 10;

  const formatDateForInput = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString().slice(0, 19); // Include seconds
  };

  useEffect(() => {
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
      if (shiftLocal === "II") {
        dataTime = parsedDate.setHours(14, 0, 0, 0);
      } else if (shiftLocal === "III") {
        dataTime = parsedDate.setHours(22, 0, 0, 0);
      }
      dataTime = formatDateTime(parsedDate);
    } else {
      dataTime = current;
    }

    if (props.isEditing && props.editData) {
      props.editData.forEach((entry) => {
        setNewEntry({
          machine: entry.Mesin || "",
          code: entry.Jenis || "",
          startTime: formatDateForInput(entry.Date),
          duration: durationData,
          comments: entry.Keterangan || "",
          shift: localStorage.getItem("shift"),
          line: value,
        });
        setStartTime(formatDateForInput(entry.Date));
      });
    } else if (props.clickedItem) {
      setNewEntry({
        machine: props.clickedItem.machineName || "",
        code: props.clickedItem.itemData || "",
        duration: durationData,
        shift: localStorage.getItem("shift"),
        line: value,
      });
      if (!startTime) setStartTime(dataTime);
    }
  }, [props.isEditing, props.editData, props.clickedItem, value]);

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

    return { startTime, endTime };
  };

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

  const calculateDifference = (start, end) => {
    if (!start || !end) return;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate < startDate) {
      alert("End Time must be later than Start Time");
      return;
    }

    const diffInMs = endDate - startDate;
    // Convert to decimal minutes instead of flooring
    const diffInMinutes = diffInMs / (1000 * 60);
    // Round to 2 decimal places for better display
    const roundedDiffInMinutes = Math.round(diffInMinutes * 100) / 100;

    setMinutesDifference(roundedDiffInMinutes);

    setNewEntry((prevEntry) => ({
      ...prevEntry,
      duration: roundedDiffInMinutes,
    }));
  };

  const calculateEndTime = (start, dur) => {
    const startDateTime = new Date(start);
    console.log("Start Date: ", startDateTime);
    const durationMinutes = parseInt(dur, 10);

    if (!isNaN(startDateTime.getTime()) && !isNaN(durationMinutes)) {
      const calculatedEndTime = new Date(
        startDateTime.getTime() + durationMinutes * 60000
      );
      console.log("Calculated End Time: ", calculatedEndTime);
      const year = calculatedEndTime.getFullYear();
      const month = String(calculatedEndTime.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
      const date = String(calculatedEndTime.getDate()).padStart(2, "0");
      const hours = String(calculatedEndTime.getHours()).padStart(2, "0");
      const minutes = String(calculatedEndTime.getMinutes()).padStart(2, "0");
      const seconds = String(calculatedEndTime.getSeconds()).padStart(2, "0");

      const formattedEndTime = `${year}-${month}-${date}T${hours}:${minutes}:${seconds}`;
      console.log("Formatted End Time: ", formattedEndTime);
      setEndTime(formattedEndTime);
      calculateDifference(start, formattedEndTime);
    } else {
      setEndTime("");
    }
  };

  const getOptions = () => {
    let category = "";
    if (props.editData && props.isEditing) {
      props.editData.forEach((entry) => {
        category = entry.Downtime_Category;
        if (!category) return [];
      });
    } else {
      category = props.clickedData?.downtime_category;
      if (!category) return [];
    }

    if (category === "Planned Stop") {
      return options.special.filter(
        (option) => option.value === "Planned Stop"
      );
    }
    if (category === "Unavailable Time") {
      return options.special.filter(
        (option) => option.value === "Unavailable Time"
      );
    }
    if (category === "Process Waiting") {
      return options.special.filter(
        (option) => option.value === "Process Waiting"
      );
    }
    if (category === "Process Failure") {
      return options.special.filter(
        (option) => option.value === "Process Failure"
      );
    }
    return minuteDifference > threshold ? options.high : options.low;
  };

  useEffect(() => {
    const options = getOptions();
    if (options.length > 0) {
      setNewEntry((prevEntry) => ({
        ...prevEntry,
        type: options[0].value, // Set the initial type to the first option value
      }));
    }
  }, [props.clickedData || props.editData, minuteDifference]);

  useEffect(() => {
    if (props.editData) {
      props.editData.forEach((entry) => {
        setId(entry.id);
      });
    }
  }, [props.editData]);

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);

    if (endTime) {
      calculateDifference(newStartTime, endTime); // Update durasi
    }
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value, 10) || 0;
    setDurationData(newDuration);
    setNewEntry((prev) => ({ ...prev, duration: newDuration }));

    if (startTime) {
      calculateEndTime(startTime, newDuration);
    }
  };

  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);

    if (startTime) {
      calculateDifference(startTime, newEndTime); // Update durasi
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    // Convert 'duration' value to an integer, and update the rest as is
    setNewEntry((prevEntry) => ({
      ...prevEntry,
      [id]: id === "duration" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleNewEntry = async () => {
    if (!startTime) {
      alert("Please add start of downtime");
      return;
    }

    if (!newEntry.comments) {
      alert("Please enter your comments.");
      return;
    }

    // ===== VALIDASI SHIFT TIME SESUAI SHIFT =====
    try {
      const shift = localStorage.getItem("shift");
      const shiftDate = localStorage.getItem("date");
      const parsedStart = new Date(startTime);
      const parsedEnd = new Date(endTime);

      if (!shift || !shiftDate || isNaN(parsedStart) || isNaN(parsedEnd)) {
        alert("Shift atau tanggal tidak valid.");
        return;
      }

      const { startTime: shiftStart, endTime: shiftEnd } = getShift(
        shift,
        new Date(shiftDate)
      );

      if (parsedStart < shiftStart || parsedStart > shiftEnd) {
        const shiftLabel =
          shift === "I"
            ? "06:00–14:00"
            : shift === "II"
            ? "14:00–22:00"
            : "22:00–06:00 (next day)";
        alert(
          `Start time must be within ${shiftDate} shift ${shift} ${shiftLabel}`
        );
        return;
      }

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

    // ===== SUBMIT DATA =====
    try {
      isLoading(true);
      const endpoint = props.isEditing
        ? "/api/updateDowntime"
        : "/api/createStoppage";
      const method = props.isEditing ? "PUT" : "POST";

      const dataToSend = {
        ...newEntry,
        startTime,
        endTime,
        id: id || undefined,
        group: localStorage.getItem("group") || undefined,
        plant: localStorage.getItem("plant") || undefined,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.message);
        return;
      }

      if (result.success) {
        setSuccess(
          props.isEditing
            ? `Stoppage updated successfully with ID: ${result.id}`
            : `Stoppage created successfully with ID: ${result.id}`
        );
      } else {
        setError(
          "The entry overlaps with other entries. Please change the start time."
        );
        return;
      }

      // Reset form
      setNewEntry({
        machine: "",
        code: "",
        startTime: "",
        endTime: "",
        duration: 0,
        comments: "",
        shift: "",
        line: "",
        type: "",
      });

      props.setShowForm2(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error creating stoppage entry:", error);
      throw error;
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
      <Draggable>
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <div
              className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-2xl"
              style={{ backgroundColor: "#A3D9A5" }}
            >
              <h3 className="text-black font-semibold">
                {props.isEditing ? "Edit Downtime" : "Report Downtime"}
              </h3>
              <button
                className="bg-transparent border-0 text-black float-right"
                onClick={() => {
                  props.edit(false);
                  props.setShowForm2(false);
                  setTimeout(() => {
                    console.log("Is editing:", props.isEditing); // Ensure state update is reflected
                  }, 0);
                }}
              >
                <span
                  className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                  style={{ backgroundColor: "#A3D9A5" }}
                >
                  x
                </span>
              </button>
            </div>
            <div className="grid grid-cols-3">
              <div className="relative col-span-1 w-full flex flex-col h-full px-10 py-4 items-center justify-center">
                <h2 className="text-black px-3 py-2 mt-0">Machine: </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">Stoppage Code: </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">Start Time: </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">End Time: </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">Duration (Minute): </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">Category: </h2>
                <br></br>
                <h2 className="text-black px-3 py-2">Comments: </h2>
              </div>
              <div className="relative col-span-2 w-full flex flex-col h-full px-10 py-4">
                {/* Machine display */}
                <div className="flex-2">
                  <h2 className="text-black mt-3">{newEntry.machine}</h2>
                </div>
                <br />

                {/* Stoppage Code */}
                <input
                  className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-600"
                  id="code"
                  name="code"
                  type="text"
                  value={newEntry.code}
                  readOnly
                  disabled
                />

                {/* Start Time */}
                <input
                  type="datetime-local"
                  name="startTime"
                  id="startTime"
                  value={startTime || currentTime}
                  onChange={handleStartTimeChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-black mt-5"
                  required
                />

                {/* End Time (editable) */}
                <input
                  type="datetime-local"
                  name="endTime"
                  id="endTime"
                  value={endTime}
                  onChange={handleEndTimeChange}
                  className="border border-gray-300 px-3 py-2 text-black mt-6"
                  step="1"
                />

                {/* Duration (readonly) */}
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  className="block w-full text-black appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-60 mt-5"
                  value={minuteDifference}
                  step="0.01"
                  readOnly
                />
                {getOptions().map((option) => (
                  <div className="mt-4" key={option.id}>
                    <div className="flex items-center mt-4">
                      <input
                        id={option.id}
                        type="checkbox"
                        name="category"
                        className="mr-2"
                        checked={true}
                        disabled
                      />
                      <label htmlFor={option.id} className="mr-4 text-black">
                        {option.label}
                      </label>
                    </div>
                  </div>
                ))}
                <input
                  type="text"
                  name="comments"
                  id="comments"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-60 mt-8 text-black"
                  placeholder="Comments"
                  value={newEntry.comments}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
              {error && (
                <div className="error-message" style={{ color: "red" }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="success-message" style={{ color: "green" }}>
                  {success}
                </div>
              )}
              <button
                className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                type="button"
                onClick={() => {
                  props.edit(false);
                  props.setShowForm2(false);
                  setTimeout(() => {
                    console.log("Is editing:", props.isEditing); // Ensure state update is reflected
                  }, 0);
                }}
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
                onClick={handleNewEntry}
                disabled={loading}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default FormFill2;
