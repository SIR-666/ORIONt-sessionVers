import { useEffect, useState } from "react";

const MasterSKUModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  line,
}) => {
  const [Category, setCategory] = useState("");
  const [sku,setSKU] = useState("");
  const [speed,setSpeed] = useState("");
  const [volume,setVolume] = useState("");
  const [active,setActive] = useState("");
  const [plant,setPlant] = useState("");
  const [selectline,setselectLine] = useState("");
  const valueActive = ["Active", "Disable"];
  const plantPicker = [
    "Milk Filling Packing",
    "Milk Processing",
    "Yogurt",
    "Cheese",
  ];
  const [tableLine, setTableLineData] = useState([]);
  const [tablefilteredLine, setTablefilteredLineData] = useState([]);

  useEffect (() => {
    // console.log(tableLine);
    if(plant==="Milk Processing")
    {
      if (plant === "Milk Processing") {
      const filteredSubGroups = tableLine
        .filter(
          (item) =>
            item.observedArea === plant && item.line === "Sterilizer"
        )
        .map((item) => item.subGroup);
      setTablefilteredLineData([...new Set(filteredSubGroups)]); // Update filtered subgroups
      
      }
    }
    else
    {
    const filteredLines = tableLine
        .filter(
          (item) => item.observedArea === plant &&
            !["Utility", "All","Matrix Valve","Incoming Area","Blending Area","CIP Kitchen","AT",
              "Control Room","MCC Panel Room","Decon Milk","Workshop Processing","Motor","Storage Tank",
              "Sterilizer","PASTEURIZER"
            ].includes(item.line)
        )
        .map((item) => item.line);
    setTablefilteredLineData([...new Set(filteredLines)]);
    }
    
  }, [plant]);

  useEffect(() => {
    const fetchPlantLine = async () =>{
      const fetchedPlantLine = await fetch(`/api/getPlantLine`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const jsonData = await fetchedPlantLine.json();
        
        // setTableLineData([...new Set(filteredLines)]);
        setTableLineData(jsonData);
        
    }

    fetchPlantLine();
    console.log(tableLine);
    if (isOpen) {
      if (initialData) {
        setCategory(initialData.Category || "");
        setSKU(initialData.sku || "");
        setSpeed(initialData.speed || "");
      } else {
        setCategory("");
        setSKU("");
        setSpeed("");
      }
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setCategory("");
    setSKU("");
    setSpeed("");
    setActive("");
    setVolume("");
    setPlant("");
    setselectLine("");
    onClose();
  };

  const handleSave = () => {
    if (!Category || !sku || !speed || !active ||!plant) {
      alert("Please fill all fields!");
      return;
    }

    onSave({
      Category: Category,
      plant: plant,
      sku: sku,
      speed: speed,
      volume:volume,
      active: active,
      selectline:selectline,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <h2 className="text-lg font-semibold mb-4 text-black">
          {initialData ? "Edit" : "Add"} Master SKU
        </h2>

        <div className="mb-4">
          <label className="block mb-1 text-black">Category</label>
          <select
            value={Category}
            onChange={(e) => setCategory(e.target.value)}
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
          <label className="block mb-1 text-black">Set Plant</label>
          <select
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          >
            <option value="">Select Plant</option>
            {plantPicker.map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Set Line</label>
          <select
            value={selectline}
            onChange={(e) => setselectLine(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          >
            <option value="">Select Line</option>
            {tablefilteredLine.map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSKU(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Speed</label>
          <input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">Volume</label>
          <input
            type="number"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          />
        </div>


        <div className="mb-4">
          <label className="block mb-1 text-black">Active</label>
          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg text-black"
          >
            <option value="">Select Value</option>
            {valueActive.map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>
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

export default MasterSKUModal;
