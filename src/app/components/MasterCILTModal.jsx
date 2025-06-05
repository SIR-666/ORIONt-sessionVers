import { useEffect, useState } from "react";

const MasterCILTModal = ({ isOpen, onClose, onSave, initialData, plant }) => {
  const [line, setLine] = useState("");
  const [machine, setMachine] = useState("");
  const [packageCategory, setPackageCategory] = useState("");
  const [type, setType] = useState("");
  const [activity, setActivity] = useState("");
  const [frekwensi, setFrekwensi] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("");
  const [good, setGood] = useState(null);
  const [need, setNeed] = useState(null);
  const [red, setRed] = useState(null);

  const packages = [
    "CHANGE OVER",
    "END CYCLE",
    "START UP",
    "CILT",
    "GI/GR",
    "CLEANING",
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setLine(initialData.line || "");
        setMachine(initialData.cilt || "");
        setPackageCategory(initialData.type || "");
        setType(initialData.ci || "");
        setActivity(initialData.activity || "");
        setFrekwensi(initialData.frekwensi || "");
        setContent(initialData.content || "");
        setImage(initialData.image || "");
        setStatus(initialData.status || "");
        setGood(initialData.good || null);
        setNeed(initialData.need || null);
        setRed(initialData.red || null);
      } else {
        setLine("");
        setMachine("");
        setPackageCategory("");
        setType("");
        setActivity("");
        setFrekwensi("");
        setContent("");
        setImage("");
        setStatus("");
        setGood(null);
        setNeed(null);
        setRed(null);
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setLine("");
    setMachine("");
    setPackageCategory("");
    setType("");
    setActivity("");
    setFrekwensi("");
    setContent("");
    setImage("");
    setStatus("");
    setGood(null);
    setNeed(null);
    setRed(null);
    onClose();
  };

  const handleSave = () => {
    if (
      !line ||
      !machine ||
      !packageCategory ||
      !type ||
      !activity ||
      !frekwensi ||
      !content ||
      !image ||
      !status
    ) {
      alert("Please fill all fields!");
      return;
    }

    onSave({
      plant: plant,
      line: line,
      cilt: machine,
      type: packageCategory,
      ci: type,
      activity: activity,
      frekwensi: frekwensi,
      content: content,
      image: image,
      status: status,
      good: good,
      need: need,
      red: red,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-6 relative">
        <h2 className="text-lg font-semibold mb-4 text-black">
          {initialData ? "Edit" : "Add"} Master CILT {plant}
        </h2>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block mb-1 text-black">Line</label>
            <input
              type="text"
              value={line.toUpperCase()}
              onChange={(e) => setLine(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black uppercase"
            />
          </div>

          <div className="w-1/2">
            <label className="block mb-1 text-black">Machine</label>
            <input
              type="text"
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block mb-1 text-black">Package</label>
            <select
              value={packageCategory}
              onChange={(e) => setPackageCategory(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
            >
              <option value="">Select Package</option>
              {packages.map((pkg, idx) => (
                <option key={idx} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
          </div>

          <div className="w-1/2">
            <label className="block mb-1 text-black">Type</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Activity</label>
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Frekuensi</label>
          <input
            type="text"
            value={frekwensi}
            onChange={(e) => setFrekwensi(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Content</label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block mb-1 text-black">Need Image</label>
            <select
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
            >
              <option value="">Select</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>

          <div className="w-1/2">
            <label className="block mb-1 text-black">Parameter GNR</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
            >
              <option value="">Select</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>
        </div>

        {status === "1" && (
          <div className="flex gap-4 mb-4">
            <div className="w-1/3">
              <label className="block mb-1 text-black">G</label>
              <input
                type="number"
                value={good}
                onChange={(e) => setGood(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
              />
            </div>

            <div className="w-1/3">
              <label className="block mb-1 text-black">N</label>
              <input
                type="number"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
              />
            </div>

            <div className="w-1/3">
              <label className="block mb-1 text-black">R</label>
              <input
                type="number"
                value={red}
                onChange={(e) => setRed(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
              />
            </div>
          </div>
        )}

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

export default MasterCILTModal;
