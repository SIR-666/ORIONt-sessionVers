import { useEffect, useState } from "react";

const MasterDowntimeModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  line,
}) => {
  const [downtimeCategory, setDowntimeCategory] = useState("");
  const [machine, setMachine] = useState("");
  const [downtime, setDowntime] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDowntimeCategory(initialData.downtimeCategory || "");
        setMachine(initialData.mesin || "");
        setDowntime(initialData.downtime || "");
      } else {
        setDowntimeCategory("");
        setMachine("");
        setDowntime("");
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setDowntimeCategory("");
    setMachine("");
    setDowntime("");
    onClose();
  };

  const handleSave = () => {
    if (!downtimeCategory || !machine || !downtime) {
      alert("Please fill all fields!");
      return;
    }

    onSave({
      downtimeCategory,
      mesin: machine,
      downtime,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <h2 className="text-lg font-semibold mb-4 text-black">
          {initialData ? "Edit" : "Add"} Master Downtime {line}
        </h2>

        <div className="mb-4">
          <label className="block mb-1 text-black">Downtime Category</label>
          <select
            value={downtimeCategory}
            onChange={(e) => setDowntimeCategory(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          >
            <option value="">Select Category</option>
            {categories.map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Machine</label>
          <input
            type="text"
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Downtime</label>
          <input
            type="text"
            value={downtime}
            onChange={(e) => setDowntime(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDowntimeModal;
