import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";

const Form = (props) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/getDowntimeCategory");
        if (!response.ok) {
          throw new Error("Failed to fetch downtime categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
        return [];
      }
    }
    loadCategories();
  }, []);

  const handleRowClick = (rowData) => {
    props.onRowClick(rowData); // Pass the clicked row data back to main page
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
                <h3 className="text-black font-semibold text-gray-700">
                  Select Downtime Category
                </h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={() => props.setShowModal(false)}
                >
                  <span
                    className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                    style={{ backgroundColor: "#A3D9A5" }}
                  >
                    x
                  </span>
                </button>
              </div>
              <br></br>
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
                  />
                </div>
              </div>
              <div
                className="relative p-6 overflow-y-auto flex-auto w-full flex flex-col"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 px-6">
                        Downtime Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b cursor-pointer"
                        onClick={() => handleRowClick(category)}
                      >
                        <td className="py-4 px-6">
                          {category.downtime_category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  //add onclick for save default option
                  onClick={() => props.setShowModal(false)} //nanti diganti ke form selanjutnya
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default Form;
