import { useState } from "react";

const CreationModal = (props) => {
  const [newLine, setNewLine] = useState({
    plant: "",
    line: "",
    status: "New",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewLine({ ...newLine, [id]: value });
  };

  const handleAddNewLine = () => {
    props.addNewLine(newLine);
    setNewLine({ plant: "", line: "", status: "New" }); // Reset input fields
  };

  const cancelAdd = () => {
    props.onChange();
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
              <h3 className="text-black font-semibold">Create New Data</h3>
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
            <div className="relative p-6 flex-auto">
              <form className="bg-gray-200 shadow-md rounded px-8 pt-6 pb-8 w-full flex flex-col sm:flex-row gap-4">
                <div className="flex-2">
                  <label for="plant" class="block mb-2 text-black font-medium">
                    Plant
                  </label>
                  <select
                    id="plant"
                    class="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={newLine.plant}
                    onChange={handleInputChange}
                  >
                    <option selected>Choose a plant</option>
                    <option value="Filling">Filling</option>
                    <option value="Processing">Processing</option>
                    <option value="Yogurt">Yogurt</option>
                    <option value="Cheese">Cheese</option>
                  </select>
                </div>
                <div className="flex-2">
                  <label for="line" class="block mb-2 text-black font-medium">
                    Production Line
                  </label>
                  <select
                    id="line"
                    class="text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={newLine.line}
                    onChange={handleInputChange}
                  >
                    <option selected>Choose a production line</option>
                    <option value="Line A">Line A</option>
                    <option value="Line B">Line B</option>
                    <option value="Line C">Line C</option>
                    <option value="Line D">Line D</option>
                    <option value="Line E">Line E</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
              <button
                className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                type="button"
                onClick={cancelAdd}
              >
                Cancel
              </button>
              <button
                className="text-white bg-yellow-500 active:bg-yellow-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1"
                type="button"
                onClick={handleAddNewLine}
              >
                Add New
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreationModal;
