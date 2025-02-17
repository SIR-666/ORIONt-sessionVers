import React from "react";

const Prod = (props) => {
  const handleRowClick = (rowData) => {
    props.onRowClick(rowData); // Pass the clicked row data back to main page
  };
  return (
    <>
      <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-2xl shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <div
              className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-2xl"
              style={{ backgroundColor: "#A3D9A5" }}
            >
              <h3 className="text-black font-semibold text-gray-700">
                Select Work Unit
              </h3>
              <button
                className="bg-transparent border-0 text-black float-right"
                onClick={() => props.setShowProd(false)}
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
            <div class="container max-w-full mx-auto">
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
            <div className="relative p-6 flex-auto w-full flex flex-col">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3 px-6">
                      Work Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    class="bg-white border-b cursor-pointer"
                    onClick={() => handleRowClick({ line: "PROC_LINE A" })}
                  >
                    <td class="py-4 px-6">PROC_LINE A</td>
                  </tr>
                  <tr
                    class="bg-white border-b"
                    onClick={() => handleRowClick({ line: "PROC_LINE B" })}
                  >
                    <td class="py-4 px-6 cursor-pointer">PROC_LINE B</td>
                  </tr>
                  <tr
                    class="bg-white border-b"
                    onClick={() => handleRowClick({ line: "PROC_LINE C" })}
                  >
                    <td class="py-4 px-6 cursor-pointer">PROC_LINE C</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
              <button
                className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                type="button"
                //add onclick for save default option
                onClick={() => props.setShowProd(false)} //nanti diganti ke form selanjutnya
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Prod;
