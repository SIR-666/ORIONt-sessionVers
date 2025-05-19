import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";

const FormType = (props) => {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const [expandedGroups, setExpandedGroups] = useState({});
  const handleItemClick = (itemData, machine) => {
    props.onItemClick(itemData, machine);
  };

  useEffect(() => {
    async function loadTypes() {
      try {
        const response = await fetch(
          `/api/getDowntimeType?cat=${props.clickedData.downtime_category}&value=${value}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch downtime types");
        }
        const data = await response.json();
        setTypes(data);
      } catch (error) {
        console.error(error);
        return [];
      }
    }
    loadTypes();
  }, [props.clickedData.downtime_category]);

  const filteredData = types.filter(
    (item) =>
      item.mesin.toLowerCase().includes(search.toLowerCase()) ||
      item.downtime.toLowerCase().includes(search.toLowerCase())
  );

  const groupByMachine = (data) => {
    return data.reduce((acc, item) => {
      if (!acc[item.mesin]) {
        acc[item.mesin] = [];
      }
      acc[item.mesin].push(item.downtime);
      return acc;
    }, {});
  };

  const groupedMachines = groupByMachine(filteredData);

  const toggleGroup = (mesin) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [mesin]: !prev[mesin], // Toggle the state
    }));
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
              <h3 className="text-black font-semibol">Select Downtime</h3>
              <button
                className="bg-transparent border-0 text-black float-right"
                onClick={() => props.setShowForm1(false)}
              >
                <span
                  className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                  style={{ backgroundColor: "#A3D9A5" }}
                >
                  x
                </span>
              </button>
            </div>
            <div className="grid grid-cols-2">
              <div className="relative col-span-1 w-full flex flex-col h-full px-10 py-4 items-center justify-center">
                <h2 className="text-black">Category: </h2>
              </div>
              <div className="relative col-span-1 w-full flex flex-col h-full px-10 py-4">
                <h2 className="text-black">
                  {props.clickedData.downtime_category}
                </h2>
                <div className="flex-2"></div>
              </div>
            </div>
            <div className="container max-w-full mx-auto">
              <div className="relative flex items-center ml-4 mr-4 h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden">
                <div className="grid place-items-center h-full w-12 text-gray-300 px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-gray-50 px-4"
                  type="text"
                  id="search"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div
              className="relative p-6 flex-auto overflow-y-auto w-full flex flex-col"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <table className="w-full text-sm text-left text-gray-500">
                <tbody>
                  {Object.entries(groupedMachines).map(
                    ([mesin, downtimes], index) => (
                      <React.Fragment key={index}>
                        {/* Header Row for Each Machine */}
                        <tr
                          className="bg-gray-200 border-b cursor-pointer"
                          onClick={() => toggleGroup(mesin)} // Toggle expand/collapse
                        >
                          <td className="py-2 px-4 font-bold">
                            {mesin}
                            <span className="ml-2 text-xs text-gray-400">
                              {expandedGroups[mesin] ? "▲" : "▼"}{" "}
                              {/* Indicator */}
                            </span>
                          </td>
                        </tr>

                        {/* Downtime Rows */}
                        {expandedGroups[mesin] && // Render if expanded
                          downtimes.map((downtime, idx) => (
                            <tr
                              className="bg-white border-b cursor-pointer border border-grey-200"
                              key={idx}
                            >
                              <td
                                className="py-4 px-6"
                                onClick={
                                  () => handleItemClick(downtime, mesin) // Handle click
                                }
                              >
                                {downtime}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
              <button
                className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                type="button"
                //add onclick for save default option
                onClick={props.onBackButtonClick} //nanti diganti ke form selanjutnya
              >
                Back
              </button>
              <button
                className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                type="button"
                //add onclick for save default option
                onClick={() => props.setShowForm1(false)} //nanti diganti ke form selanjutnya
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default FormType;
