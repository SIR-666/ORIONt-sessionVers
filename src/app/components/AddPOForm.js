import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProdFill = (props) => {
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [group, setGroup] = useState("");
  const [groupSelection, setGroupSelection] = useState({});
  const [shiftBoxes, setShiftBoxes] = useState([]);
  const [groupData, setGroupData] = useState(null);
  const [data, setData] = useState([]);
  const [tablePlant, setTablePlantData] = useState([]);
  const [tableLine, setTableLineData] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [processingLines, setProcessingLines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, isLoading] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getPlantLine`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const jsonData = await response.json();
        console.log("Fetched Data: ", jsonData);
        const filteredData = jsonData.filter(
          (item) => item.observedArea !== "AM PM"
        );
        setData(filteredData); // Set the full data
        const uniqueObservedAreas = [
          ...new Set(filteredData.map((item) => item.observedArea)),
        ];
        console.log("Unique Observed Areas:", uniqueObservedAreas); // Log unique areas
        setTablePlantData(uniqueObservedAreas);
        setTableLineData([...new Set(jsonData.map((item) => item.line))]);
      } catch (error) {
        console.error("Error:", error);
        alert("Error getting plant & line data: " + error.message);
      }
    };
    fetchData();
  }, []);

  const handleSelectLine = (event) => {
    const value = event.target.value;
    setSelectedLine(value);
  };

  const handleSelectPlant = (event) => {
    const selectedPlant = event.target.value;
    setSelectedPlant(selectedPlant);
    setSelectedLine("");
    setProcessingLines("");

    if (selectedPlant === "Milk Processing") {
      const filteredSubGroups = data
        .filter(
          (item) =>
            item.observedArea === selectedPlant && item.line === "Sterilizer"
        )
        .map((item) => item.subGroup);
      setProcessingLines([...new Set(filteredSubGroups)]); // Update filtered subgroups
      setFilteredLines([]);
    } else if (selectedPlant === "Milk Filling Packing") {
      const filteredLines = data
        .filter(
          (item) =>
            item.observedArea === selectedPlant &&
            !["Utility", "All"].includes(item.line)
        )
        .map((item) => item.line);
      setFilteredLines([...new Set(filteredLines)]);
      setProcessingLines([]);
    } else {
      const filteredLines = data
        .filter((item) => item.observedArea === selectedPlant)
        .map((item) => item.line);
      setFilteredLines([...new Set(filteredLines)]);
      setProcessingLines([]);
    }
  };

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

  const handleGroupChange = (shiftIndex, selectedGroup) => {
    setGroupSelection((prevSelections) => ({
      ...prevSelections,
      [shiftIndex]: selectedGroup, // Update only the group for the specific shift
    }));
  };

  const handleNewEntry = async () => {
    if (!selectedPlant || !selectedLine) {
      alert("Please determine the area and production line of No PO");
      return;
    }

    if (!startTime || !endTime) {
      alert("Please add start and end of No PO");
      return;
    }

    if (!groupSelection) {
      alert("Group must be selected");
      return;
    }

    try {
      isLoading(true);
      console.log(
        "Sent data: ",
        startTime,
        endTime,
        selectedPlant,
        selectedLine,
        groupSelection
      );
      const response = await fetch("/api/createEmptyPO", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime,
          endTime,
          plant: selectedPlant,
          line: selectedLine,
          groupSelection,
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
      router.push(`/main?value=${selectedLine}&id=${result.id}`);
    } catch (error) {
      console.error("Error creating PO entry:", error);
      throw error;
    } finally {
      isLoading(false);
    }
    // if (!newEntry.date_start && !newEntry.date_end) {
    //   alert("Please add missing fields");
    //   return;
    // }
    // if (!newEntry.qty) {
    //   alert("Please enter the quantity");
    //   return; // Prevent submission
    // }
    // props.addNewData(newEntry);
    // setNewEntry({
    //   sku: "",
    //   date_start: "",
    //   date_end: "",
    //   qty: 0,
    //   status: "New",
    // }); // Reset input fields
    // props.setShowForm2(false);
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
                className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={selectedPlant}
                onChange={handleSelectPlant}
              >
                <option value="">Choose a plant</option>
                {tablePlant.length > 0 ? (
                  tablePlant.map((area, index) => (
                    <option key={index} value={area}>
                      {area}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No plants available
                  </option>
                )}
              </select>
              <br></br>
              {selectedPlant === "Milk Processing" ? (
                <select
                  id="subGroup"
                  className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={selectedLine}
                  onChange={handleSelectLine}
                  disabled={processingLines.length === 0} // Disable if no subgroups
                >
                  <option value="">Choose a production line</option>
                  {processingLines.length > 0 ? (
                    processingLines.map((subGroup, index) => (
                      <option key={index} value={subGroup}>
                        {subGroup}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No lines available for this plant
                    </option>
                  )}
                </select>
              ) : (
                <select
                  id="line"
                  className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  value={selectedLine}
                  onChange={handleSelectLine}
                  disabled={!selectedPlant} // Disable until an area is selected
                >
                  <option value="">Choose a production line</option>
                  {filteredLines.length > 0 ? (
                    filteredLines.map((line, index) => (
                      <option key={index} value={line}>
                        {line}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No lines available for this plant
                    </option>
                  )}
                </select>
              )}
              <input
                type="datetime-local"
                name="date_start"
                id="date_start"
                value={startTime}
                onChange={handleStartTimeChange}
                className="border border-gray-300 px-3 py-2 text-black mt-5"
              />
              {/* <input
                type="number"
                name="duration"
                id="duration"
                className="mt-1 block w-full text-black appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-60 mt-5"
                // value={minutesDifference}
              /> */}
              <input
                type="datetime-local"
                name="date_end"
                id="date_end"
                value={endTime}
                onChange={handleEndTimeChange}
                className="border border-gray-300 px-3 py-2 text-black mt-5"
              />
              <br></br>
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
                <p className="text-gray-500">
                  Please insert start time and end time first
                </p>
              )}
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
