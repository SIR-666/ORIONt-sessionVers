import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProdFill = (props) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shiftBoxes, setShiftBoxes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, isLoading] = useState(false);
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [group, setGroup] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedPlant = sessionStorage.getItem("plant");
    const storedLine = sessionStorage.getItem("line");
    const storedGroup = sessionStorage.getItem("group");

    setPlant(storedPlant);
    setLine(storedLine);
    setGroup(storedGroup);

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

    if (dataTime) {
      const parsedDate = new Date(dataTime);
      if (props.shift === "I") {
        dataTime = parsedDate.setHours(6, 0, 0, 0);
      } else if (props.shift === "II") {
        dataTime = parsedDate.setHours(14, 0, 0, 0);
      } else if (props.shift === "III") {
        dataTime = parsedDate.setHours(22, 0, 0, 0);
      }
      dataTime = formatDateTime(parsedDate);
    } else {
      dataTime = current;
    }
    if (!startTime) setStartTime(dataTime);
  }, []);

  const calculateShifts = (startTime, endTime) => {
    const shifts = [
      { start: "06:00", end: "14:00" }, // Shift I
      { start: "14:00", end: "22:00" }, // Shift II
      { start: "22:00", end: "06:00" }, // Shift III (next day)
    ];

    const start = new Date(startTime);
    const end = new Date(endTime);

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
        if (
          (start >= shiftStart && start < shiftEnd) ||
          (end > shiftStart && end <= shiftEnd) ||
          (start < shiftStart && end > shiftEnd)
        ) {
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

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);

    if (newStartTime && endTime) {
      calculateShifts(newStartTime, endTime);
    }
  };

  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);

    if (startTime && newEndTime) {
      calculateShifts(startTime, newEndTime);
    }
  };

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

  const handleNewEntry = async () => {
    if (!plant || !line) {
      alert("Please determine the area and production line of No PO");
      return;
    }

    if (!startTime || !endTime) {
      alert("Please add start and end of No PO");
      return;
    }

    if (!group) {
      alert("Group must be selected");
      return;
    }

    // ===== VALIDASI SHIFT TIME SESUAI SHIFT =====
    try {
      const shift = sessionStorage.getItem("shift");
      const shiftDate = sessionStorage.getItem("date");
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

    try {
      isLoading(true);
      const response = await fetch("/api/createEmptyPO", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime,
          endTime,
          plant: plant,
          line: line,
          groupSelection: group,
        }),
      });

      const result = await response.json();
      if (result.error) {
        setError(result.message);
        return;
      }
      console.log("New PO Entry:", result);
      alert("New No-PO entry created");
      await props.onUpdate();
      props.setShowForm2(false);
      sessionStorage.setItem("id", result.id);
      router.push(`/main?value=${line}&id=${result.id}`);
    } catch (error) {
      console.error("Error creating PO entry:", error);
      throw error;
    } finally {
      isLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
      <div className="relative w-auto my-6 mx-auto max-w-3xl">
        <div className="border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
          <div
            className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-2xl"
            style={{ backgroundColor: "#A3D9A5" }}
          >
            <h3 className="text-black font-semibold">Add No PO</h3>
            <button
              className="bg-transparent border-0 text-black float-right"
              onClick={() => props.setShowForm2(false)}
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
              <h2 className="text-black px-3 py-2">Plant: </h2>
              <br></br>
              <h2 className="text-black px-3 py-2">Line: </h2>
              <br></br>
              <h2 className="text-black px-3 py-2">Start Time: </h2>
              <br></br>
              <h2 className="text-black px-3 py-2">End Time: </h2>
              <br></br>
              <h2 className="text-black px-3 py-2">Group: </h2>
            </div>
            <div className="relative col-span-2 w-full flex flex-col h-full px-10 py-4">
              <select
                id="observedArea"
                className="text-black rounded-lg border focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={plant}
              >
                <option value={plant}>{plant}</option>
              </select>
              <br></br>
              <select
                id="line"
                className="text-black rounded-lg border focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={line}
              >
                <option value={line}>{line}</option>
              </select>
              <input
                type="datetime-local"
                name="date_start"
                id="date_start"
                value={startTime}
                onChange={handleStartTimeChange}
                className="border border-gray-300 px-3 py-2 text-black mt-5"
              />
              <input
                type="datetime-local"
                name="date_end"
                id="date_end"
                value={endTime}
                onChange={handleEndTimeChange}
                className="border border-gray-300 px-3 py-2 text-black mt-5"
              />
              <br></br>
              <select
                id="group"
                className="text-black rounded-lg border focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={group}
              >
                <option value={group}>{group}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
            <button
              className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
              type="button"
              //add onclick for save default option
              onClick={() => props.setShowForm2(false)}
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
              onClick={handleNewEntry} //nanti diganti ke metode submit (connect ke backend)
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProdFill;
