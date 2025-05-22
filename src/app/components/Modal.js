import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";
import url from "../url";

const Modal = (props) => {
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTank, setSelectedTank] = useState("");
  const [selectedFermentor, setSelectedFermentor] = useState("");
  const [data, setData] = useState([]);
  const [tablePlant, setTablePlantData] = useState([]);
  const [tableLine, setTableLineData] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [processingLines, setProcessingLines] = useState([]);
  const [group, setGroup] = useState([]);
  const [previousPage, setPreviousPage] = useState(null);
  const router = useRouter();
  const handleSelectLine = (event) => {
    const value = event.target.value;
    setSelectedLine(value);
  };

  const handleSelectShift = (event) => {
    const value = event.target.value;
    setSelectedShift(value);
  };

  const handleSelectGroup = (event) => {
    const value = event.target.value;
    setSelectedGroup(value);
  };

  const handleSelectTank = (event) => {
    const value = event.target.value;
    setSelectedTank(value);
  };

  const handleSelectFermentor = (event) => {
    const value = event.target.value;
    setSelectedFermentor(value);
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedDate(value);
    console.log("Selected Date: ", selectedDate);
  };

  const handleSelectPlant = (event) => {
    const selectedPlant = event.target.value;
    setSelectedPlant(selectedPlant);
    setSelectedLine("");
    setProcessingLines("");
    setSelectedGroup("");

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

  useEffect(() => {
    // Check if running in the browser
    if (typeof window !== "undefined") {
      setPreviousPage(document.referrer);
    }
  }, []);

  const handleClose = () => {
    console.log("Current pathname: ", window.location.pathname);

    if (window.location.pathname === "/order") {
      if (previousPage.includes("/login")) {
        // Clear sessionStorage if the previous page is login
        sessionStorage.removeItem("profile");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("plant");
        sessionStorage.removeItem("line");
        sessionStorage.removeItem("selectedMaterial");
        sessionStorage.removeItem("materialData");
        sessionStorage.removeItem("shift");
        sessionStorage.removeItem("date");
        sessionStorage.removeItem("group");
        sessionStorage.removeItem("tank");
        sessionStorage.removeItem("fermentor");

        // Redirect to login page
        router.push("/login");
      } else {
        // Redirect to the previous page
        router.back();
      }
    } else {
      props.setShowModal(false);
    }
  };

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

  useEffect(() => {
    if (data.length > 0) {
      const storedPlant = sessionStorage.getItem("plant");
      const storedLine = sessionStorage.getItem("line");
      const storedShift = sessionStorage.getItem("shift");
      const storedDate = sessionStorage.getItem("date");
      const storedGroup = sessionStorage.getItem("group");
      if (storedPlant) {
        setSelectedPlant(storedPlant);
        handleSelectPlant({ target: { value: storedPlant } });
      }
      if (storedLine) setSelectedLine(storedLine);
      if (storedShift) setSelectedShift(storedShift);
      if (storedDate) setSelectedDate(storedDate);
      if (storedGroup) setSelectedGroup(storedGroup);
      if (storedPlant === "Milk Processing")
        setSelectedTank(sessionStorage.getItem("tank"));
      if (storedPlant === "Yogurt" && storedLine === "PASTEURIZER")
        setSelectedFermentor(sessionStorage.getItem("fermentor"));
    }
  }, [data]);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (selectedPlant) {
        try {
          const response = await fetch(
            `${url.URL}/getGroupByPlant?plant=${selectedPlant}`,
            {
              cache: "no-store",
            }
          );

          const jsonData = await response.json();
          console.log("Fetched Group Data: ", jsonData);

          // Ambil hanya field `group` dan buat unique list
          const uniqueGroups = [...new Set(jsonData.map((item) => item.group))];
          console.log("group :", uniqueGroups);
          setGroup(uniqueGroups);
        } catch (error) {
          console.error("Error fetching group data:", error);
        }
      }
    };

    fetchGroupData();
  }, [selectedPlant]);

  const handleSubmit = () => {
    const encodedParams = `value=${encodeURIComponent(
      selectedLine
    )}&shift=${encodeURIComponent(selectedShift)}&date=${encodeURIComponent(
      selectedDate
    )}`;

    const route = `../order/po?${encodedParams}`;

    // Simpan data
    sessionStorage.setItem("plant", selectedPlant);
    sessionStorage.setItem("line", selectedLine);
    sessionStorage.setItem("shift", selectedShift);
    sessionStorage.setItem("date", selectedDate);
    sessionStorage.setItem("group", selectedGroup);
    if (selectedPlant === "Milk Processing") {
      sessionStorage.setItem("tank", selectedTank);
    }
    if (selectedPlant === "Yogurt" && selectedLine === "PASTEURIZER") {
      sessionStorage.setItem("fermentor", selectedFermentor);
    }

    // Bersihkan jika ada
    if (sessionStorage.getItem("selectedMaterial")) {
      sessionStorage.removeItem("selectedMaterial");
      console.log("ID removed from sessionStorage");
    }

    // Navigasi
    router.push(route);

    // Reload hanya jika semua field tersedia
    if (
      selectedLine &&
      selectedPlant &&
      selectedShift &&
      selectedDate &&
      selectedGroup
    ) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }

    props.setShowModal(false);
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
                  Set Plant & Production Line
                </h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={handleClose}
                >
                  <span
                    className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                    style={{ backgroundColor: "#A3D9A5" }}
                  >
                    x
                  </span>
                </button>
              </div>
              <div className="relative p-6 flex-auto">
                <form className="bg-gray-200 shadow-md rounded px-8 pt-6 w-full flex flex-col sm:flex-row gap-4">
                  <div className="flex-2">
                    <label
                      htmlFor="plant"
                      className="block mb-2 text-black font-medium"
                    >
                      Plant
                    </label>
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
                  </div>
                  {selectedPlant === "Milk Processing" ? (
                    <div className="flex-2">
                      <label
                        htmlFor="subGroup"
                        className="block mb-2 text-black font-medium"
                      >
                        Sterilizer
                      </label>
                      <select
                        id="subGroup"
                        className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        value={selectedLine}
                        onChange={handleSelectLine}
                        disabled={processingLines.length === 0} // Disable if no subgroups
                      >
                        <option value="">Choose a sterilizer</option>
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
                    </div>
                  ) : (
                    <div className="flex-2">
                      <label
                        htmlFor="line"
                        className="block mb-2 text-black font-medium"
                      >
                        Production Line
                      </label>
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
                    </div>
                  )}
                  {selectedPlant === "Milk Processing" ? (
                    <div className="flex-2">
                      <label
                        htmlFor="plant"
                        className="block mb-2 text-black font-medium"
                      >
                        Tank
                      </label>
                      <select
                        id="observedArea"
                        className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        value={selectedTank}
                        onChange={handleSelectTank}
                      >
                        <option value="">Choose a tank</option>
                        <option value="AT1">AT1</option>
                        <option value="AT2">AT2</option>
                        <option value="AT3">AT3</option>
                        <option value="AT4">AT4</option>
                        <option value="AT5">AT5</option>
                      </select>
                    </div>
                  ) : null}
                  {selectedPlant === "Yogurt" &&
                  selectedLine === "PASTEURIZER" ? (
                    <div className="flex-2">
                      <label
                        htmlFor="plant"
                        className="block mb-2 text-black font-medium"
                      >
                        Fermentor
                      </label>
                      <select
                        id="observedArea"
                        className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        value={selectedFermentor}
                        onChange={handleSelectFermentor}
                      >
                        <option value="">Choose a fermentor</option>
                        <option value="T101">T101</option>
                        <option value="T103">T103</option>
                        <option value="T104">T104</option>
                        <option value="T105">T105</option>
                        <option value="T111">T111</option>
                      </select>
                    </div>
                  ) : null}
                </form>
                <form className="bg-gray-200 shadow-md rounded px-8 pt-6 pb-8 w-full flex flex-col sm:flex-row gap-14">
                  <div className="flex-2">
                    <label
                      htmlFor="plant"
                      className="block mb-2 text-black font-medium"
                    >
                      Shift
                    </label>
                    <select
                      id="observedArea"
                      className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      value={selectedShift}
                      onChange={handleSelectShift}
                    >
                      <option value="">Choose a shift</option>
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                    </select>
                  </div>
                  <div className="flex-2">
                    <label
                      htmlFor="date"
                      className="block mb-2 text-black font-medium"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate || ""}
                      onChange={handleChange}
                      max={moment().utcOffset(7).format("YYYY-MM-DD")} // ⛔️ tidak bisa pilih hari besok
                      className="border rounded-md p-2 text-black"
                    />
                  </div>
                  <div className="flex-2">
                    <label
                      htmlFor="plant"
                      className="block mb-2 text-black font-medium"
                    >
                      Group
                    </label>
                    <select
                      id="group"
                      className="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      value={selectedGroup}
                      onChange={handleSelectGroup}
                      disabled={!selectedPlant}
                    >
                      <option value="">Choose a group</option>
                      {group && group.length > 0 ? (
                        group.map((item, index) => (
                          <option key={index} value={item}>
                            {item}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No groups available for this plant
                        </option>
                      )}
                    </select>
                  </div>
                </form>
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  //add onclick for save default option
                  hidden
                >
                  Save Default
                </button>
                {selectedPlant === "" ||
                selectedLine === "" ||
                selectedShift === "" ||
                selectedDate === null ||
                selectedGroup === "" ? (
                  <button
                    className="text-white bg-gray-500 px-6 py-3 font-bold uppercase text-sm rounded shadow"
                    type="button"
                    disabled
                  >
                    Submit
                  </button>
                ) : (
                  <button
                    className="text-white bg-yellow-500 active:bg-yellow-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                    type="button"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default Modal;
