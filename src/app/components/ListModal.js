import React from "react";
import { useRouter } from "next/navigation";

const ListModal = (props) => {
  const router = useRouter();

  const handleSelectLine = (lineData) => {
    router.push(`../order/${lineData.plant}/?value=${lineData.line}`);
  };

  const handleClick = () => {
    props.onClick();
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
                List of Plants & Lines
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
            <div className="relative p-6 flex-auto scrollable-container">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3 px-6">
                      No
                    </th>
                    <th scope="col" class="py-3 px-6">
                      Plant
                    </th>
                    <th scope="col" class="py-3 px-6">
                      Line
                    </th>
                    <th scope="col" class="py-3 px-6">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.dataList.map((item) => (
                    <tr
                      class="bg-white border-b cursor-pointer"
                      key={item.number}
                      onClick={() => handleSelectLine(item)}
                    >
                      <td class="py-4 px-6">{item.number}</td>
                      <td class="py-4 px-6">{item.plant}</td>
                      <td class="py-4 px-6">{item.line}</td>
                      <td class="py-4 px-6">{item.status}</td>
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
                onClick={handleClick}
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListModal;
