import { getShift } from "@/utils/getShift";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

const Start = (props) => {
  const [time, setTime] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [inputChange, setInputChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGroup, setCurrentGroup] = useState("");
  const [group, setGroup] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupData, setGroupData] = useState(null);
  const shift = sessionStorage.getItem("shift");
  const date = sessionStorage.getItem("date");
  const params = useSearchParams();
  const value = params.get("value");
  const { id, status } = props;
  const router = useRouter();

  // Cek perubahan group dan currentGroup
  useEffect(() => {
    if (group && currentGroup && group !== currentGroup) {
      setGroupMessage("Selected group not same");
    } else {
      setGroupMessage("");
    }
  }, [group, currentGroup]);

  function toLocalISO(date) {
    const localDate = new Date(date);
    localDate.setHours(localDate.getHours() - 7);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");
    const seconds = String(localDate.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  }

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const now = new Date();
    const current = formatDateTime(now);

    let dataTime = sessionStorage.getItem("date");
    const shiftLocal = sessionStorage.getItem("shift");
    setCurrentGroup(sessionStorage.getItem("group"));

    if (dataTime) {
      const parsedDate = new Date(dataTime);

      if (shiftLocal === "I") {
        parsedDate.setHours(6, 0, 0, 0);
      } else if (shiftLocal === "II") {
        parsedDate.setHours(14, 0, 0, 0);
      } else if (shiftLocal === "III") {
        parsedDate.setHours(22, 0, 0, 0);
      }

      dataTime = formatDateTime(parsedDate); // ✅ Format untuk input
    } else {
      dataTime = formatDateTime(new Date()); // fallback
    }

    setCurrentTime(current);
    if (!time) setTime(dataTime);
  }, []);

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

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    setInputChange(true);
    if (id === "actual_start") {
      const localDate = new Date(value);
      const formatted = formatDateTime(localDate); // 👈 tanpa konversi ke UTC
      setTime(formatted);
      console.log("New Date (local): ", formatted);
    }
  };

  const handleGroupChange = (event) => {
    const selectedGroup = event.target.value;
    setGroup(selectedGroup);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async () => {
    if (!id || !time || !value) {
      alert("ID and date must be provided");
      return;
    }

    // ===== VALIDASI SHIFT TIME SESUAI SHIFT =====
    try {
      const shift = sessionStorage.getItem("shift");
      const shiftDate = sessionStorage.getItem("date");
      const parsedStart = moment(time).toDate();

      if (!shift || !shiftDate || isNaN(parsedStart)) {
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
    } catch (err) {
      console.error("Shift validation error:", err);
      alert("Terjadi kesalahan saat validasi waktu shift.");
      return;
    }

    const sortedData = [...props.lineData].sort(
      (a, b) => new Date(a.actual_start) - new Date(b.actual_start)
    );

    const localTime = new Date(time);
    if (inputChange === true) {
      localTime.setHours(localTime.getHours() - 7);
    }

    let comparedTime;
    if (inputChange === true) {
      comparedTime = `${time}:00.000Z`;
    } else {
      comparedTime = `${time}:00.000Z`;
    }

    for (let i = 0; i < sortedData.length; i++) {
      const currentPO = sortedData[i];
      const nextPO = sortedData[i + 1]; // Next PO (if exists)

      // Check if the new PO overlaps with the current PO's range
      if (
        comparedTime >= currentPO.actual_start &&
        comparedTime < currentPO.actual_end
      ) {
        alert("The new Production Order overlaps with an existing one.");
        return;
      }

      // Check if the new PO fits within a valid gap
      if (
        comparedTime >= currentPO.actual_end &&
        (!nextPO || comparedTime < nextPO.actual_start)
      ) {
        // Valid gap found
        break;
      }
    }

    if (!group) {
      alert("Group must be selected");
      return;
    }

    const userConfirmed = window.confirm(
      `Are you sure the start time of the Production Order is correct?`
    );

    if (userConfirmed) {
      setLoading(true);
      try {
        const shiftTime = getShift(shift, date);
        let startTime;
        const start = new Date(time);
        start.setHours(start.getHours() - 7);
        startTime = start < shiftTime.startTime ? shiftTime.startTime : start;

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
            plant,
            startTime: toLocalISO(startTime),
          }),
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.error || "Failed to update order");
        }

        const data = await response.json();
        alert("Production order started successfully!");
        await props.onUpdate();
        props.setShowStart(false);

        sessionStorage.setItem("id", data.id);
        router.push(`/main?value=${value}&id=${data.id}`);
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
                <h3 className="text-black font-semibold">Set Start Time</h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={() => props.setShowStart(false)}
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
                    <h2 className="text-black mt-3">Start Time: </h2>
                  </div>
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    <input
                      type="datetime-local"
                      name="actual_start"
                      id="actual_start"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={time.slice(0, 16)}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    <h2 className="text-black mt-4">Target Status: </h2>
                    <br></br>
                    {/* <h2 className="text-black">Crew Size: </h2> */}
                    {/* <br></br> */}
                    <h2 className="text-black mt-1">Select Group: </h2>
                  </div>
                  <div className="relative col-span-1 w-full flex flex-col h-full">
                    <select
                      id="plant"
                      className="text-black rounded-lg border border-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 mt-2 ml-0"
                    >
                      <option defaultValue="Active">Active</option>
                    </select>
                    <select
                      id="group"
                      className="text-black rounded-lg border border-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2 mt-2 ml-0"
                      value={group}
                      onChange={handleGroupChange}
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

                    {groupMessage && (
                      <p className="text-red-500 mt-2">{groupMessage}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  onClick={() => props.setShowStart(false)}
                >
                  Cancel
                </button>
                <button
                  className={`text-white ${
                    loading || (group && currentGroup && group !== currentGroup)
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 active:bg-yellow-700"
                  } font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1`}
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    loading || (group && currentGroup && group !== currentGroup)
                  } // Disable button saat group tidak sama
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

export default Start;
