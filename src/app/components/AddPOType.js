import React, { useState } from "react";

const ProdType = (props) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSelectItem = (event) => {
    setSelectedItem(event.target.value);
  };

  const handleItemClick = (itemData) => {
    if (selectedItem) {
      props.onItemClick(selectedItem, itemData); // Pass the clicked row data back to main page
    } else {
      alert("Please select a dropdown option first!");
    }
  };

  const materialData = {
    UHT: [
      "GF MILK UHT FC RP 950 LCL @12",
      "GF MILK UHT WC BA 1000 LCL @12",
      "GF MILK UHT FC IP BA 1000 @12",
    ],
    ESL: [
      "GF MILK ESL FC RP 500 LCL @12",
      "GF MILK ESL STR RP 1000 LCL @6",
      "GF MILK ESL STR RP 200 LCL @12",
    ],
    Yoghurt: [],
    Cheese: [],
  };

  const fetchMaterialData = async (cat) => {
    const res = await fetch(`/api/getListSKU?category=${cat}`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const result = await res.json();
    setData(result);
    // Transform the data to an object format expected by your render method
    const formattedData = data.reduce((acc, item) => {
      // Assuming `item.sku` is what you want to display
      const category = cat; // or derive category from item if applicable
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item.sku);
      return acc;
    }, {});
    setData(formattedData);
    setLoading(false);
  };

  const renderTableRows = () => {
    const item = materialData[selectedItem] || [];
    return item.map((item, index) => (
      <tr
        key={index}
        className="bg-white border-b cursor-pointer border border-grey-200"
      >
        <td className="py-4 px-6" onClick={() => handleItemClick(item)}>
          {item}
        </td>
      </tr>
    ));
  };

  return (
    <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
      <div className="relative w-auto my-6 mx-auto max-w-3xl">
        <div className="border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
          <div
            className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-2xl"
            style={{ backgroundColor: "#A3D9A5" }}
          >
            <h3 className="text-black font-semibold text-gray-700">
              Select Material
            </h3>
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
              <h2 className="text-black">Line: </h2>
              <br></br>
              <h2 className="text-black">Type: </h2>
            </div>
            <div className="relative col-span-1 w-full flex flex-col h-full px-10 py-4">
              <h2 className="text-black">{props.clickedData}</h2>
              <br></br>
              <div className="flex-2">
                <select
                  id="plant"
                  class="text-black rounded-lg border border-gray-900 focus:ring-blue-500 focus:border-blue-500 block w-full"
                  value={selectedItem}
                  onChange={handleSelectItem}
                >
                  <option value="">Select</option>
                  <option value="UHT">Milk (UHT)</option>
                  <option value="ESL">Milk (ESL)</option>
                  <option value="Yogurt">Yogurt</option>
                  <option value="Cheese">Cheese</option>
                </select>
              </div>
            </div>
          </div>
          <div className="container max-w-full mx-auto">
            <div class="relative flex items-center ml-4 mr-4 h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden">
              <div class="grid place-items-center h-full w-12 text-gray-300 px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
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
                class="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-gray-50 px-4"
                type="text"
                id="search"
                placeholder="Search"
              />
            </div>
          </div>
          <div className="relative p-6 flex-auto overflow-y-auto w-full h-full flex flex-col">
            <table class="w-full text-sm text-left text-gray-500">
              <tbody>
                {selectedItem === "Stoppages" ? (
                  // Display all items if "Stoppages" is selected
                  <>
                    {Object.keys(materialData).map((category) =>
                      materialData[category].map((item, index) => (
                        <tr
                          key={index}
                          className="bg-white border-b overflow-x-auto cursor-pointer border border-grey-200"
                        >
                          <td
                            className="py-4 px-6"
                            onClick={() => handleItemClick(item)}
                          >
                            {item}
                          </td>
                        </tr>
                      ))
                    )}
                  </>
                ) : (
                  // Conditionally render based on selected plant
                  renderTableRows()
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
            <button
              className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
              type="button"
              onClick={() => props.setShowForm1(false)} //nanti diganti ke form selanjutnya
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProdType;
