import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";
import nominalSpeeds from "../speed";

const QualityLoss = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [filling, setFilling] = useState(0);
  const [packing, setPacking] = useState(0);
  const [sample, setSample] = useState(0);
  const [group, setGroup] = useState("");
  const [skuSpeed, setSKUSpeed] = useState(null);
  const [sku, setSKU] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const params = useSearchParams();
  const id = params.get("id");
  const value = params.get("value");
  const shift = localStorage.getItem("shift");
  const date = localStorage.getItem("date");
  const plant = localStorage.getItem("plant");

  const formattedLineName = value.replace(/\s+/g, "_").toUpperCase();

  // Access the nominal speed from the map
  const nominalSpeed = nominalSpeeds[formattedLineName];

  function getLocalISOString() {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000; // Convert offset to milliseconds
    const localISOTime = new Date(now - tzOffsetMs).toISOString().slice(0, -1); // Remove Z at the end

    return `${localISOTime}Z`; // Append Z to denote ISO 8601 format
  }

  const getShift = (shift, date) => {
    if (!date || isNaN(new Date(date))) {
      console.error("Invalid date provided.");
      return null;
    }
    let startTime, endTime;
    switch (shift) {
      case "I":
        startTime = new Date(date);
        startTime.setHours(6, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(14, 0, 0, 0);
        break;
      case "II":
        startTime = new Date(date);
        startTime.setHours(14, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(22, 0, 0, 0);
        break;
      case "III":
        startTime = new Date(date);
        startTime.setHours(22, 0, 0, 0);
        endTime = new Date(date);
        endTime.setDate(endTime.getDate() + 1); // Move to the next day
        endTime.setHours(6, 0, 0, 0);
        break;
      default:
        console.warn("Invalid shift provided.");
        return null; // Handle invalid shift
    }
    console.log("Shift start time: ", startTime);
    console.log("Shift end time: ", endTime);

    return { startTime, endTime };
  };

  function toLocalISO(date) {
    const localDate = new Date(date);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");
    const seconds = String(localDate.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productionOrderRes = await fetch(`/api/getPObyId?id=${id}`);

        if (!productionOrderRes.ok) {
          throw new Error("Failed to fetch one or more quality loss in PO");
        }

        const productionData = await productionOrderRes.json();
        console.log("Retrieved Data: ", productionData);

        // Sort and set the production order data
        setData(productionData[0]);
        console.log("State after fetch:", data);

        // Handle stoppage data
        productionData.forEach(async (element) => {
          const getShiftTimes = getShift(shift, date);
          let startTime, endTime;

          const start = new Date(element.actual_start);
          start.setHours(start.getHours() - 7);

          const end = element.actual_end
            ? new Date(element.actual_end)
            : new Date();
          if (element.actual_end) {
            end.setHours(end.getHours() - 7);
          }

          startTime =
            start < getShiftTimes.startTime ? getShiftTimes.startTime : start;
          endTime = end < getShiftTimes.endTime ? end : getShiftTimes.endTime;
          const res = await fetch("/api/getRejectSample", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              line: value,
              date_start: toLocalISO(startTime),
              date_end: toLocalISO(endTime) || getLocalISOString(),
              plant: plant,
            }),
          });
          if (!res.ok) {
            throw new Error(
              "Failed to fetch reject filling, reject packing, and sample data"
            );
          }

          const qualityData = await res.json();
          console.log("Reject samples: ", qualityData);
          if (Array.isArray(qualityData) && qualityData.length > 0) {
            const downtimeMap = qualityData.reduce((acc, item) => {
              acc[item.name] = item.Downtime;
              return acc;
            }, {});

            setFilling(downtimeMap["Reject filling(Pcs)"] || 0);
            setPacking(downtimeMap["Reject packing (Pcs)"] || 0);
            setSample(downtimeMap["Sample (pcs)"] || 0);
          }
          setGroup(element.group);
          setSKU(element.sku);
        });
      } catch {
        console.error("Error fetching data:", error);
        alert("Error fetching rejected goods data: " + error.message);
      }
    };

    if (id && value) {
      fetchData(); // Only fetch when `id` is available
    }
  }, [id, value]);

  useEffect(() => {
    const getSpeed = async () => {
      let speed;

      if (sku !== "") {
        try {
          const speeds = [];
          const response = await fetch(`/api/getSpeedSKU`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sku: sku }),
          });

          const skuData = await response.json();
          console.log("Speed data: ", skuData[0].speed);
          if (skuData && typeof skuData[0].speed === "number") {
            speeds.push(skuData[0].speed); // Push valid speed values only
          } else {
            console.warn(`No speed found for SKU ${sku}`);
          }

          // Use the first valid speed found or fallback to the nominal speed
          speed =
            speeds.length > 0 ? speeds[0] : nominalSpeeds[formattedLineName];
        } catch (error) {
          console.error("Error fetching SKU nominal speed:", error);
          speed = null;
        }
      } else {
        speed = nominalSpeeds[formattedLineName];
      }

      console.log("Final speed returned:", speed);
      setSKUSpeed(speed); // Set the final speed in the state
    };

    // Trigger speed calculation when SKU changes
    if (sku) {
      getSpeed();
    }
  }, [sku, formattedLineName]);

  const handleFilling = (event) => {
    const inputValue = event.target.value;
    if (!isNaN(inputValue) || inputValue === "") {
      setFilling(inputValue);
    }
  };

  const handlePacking = (event) => {
    const inputValue = event.target.value;
    if (!isNaN(inputValue) || inputValue === "") {
      setPacking(inputValue);
    }
  };

  const handleSample = (event) => {
    const inputValue = event.target.value;
    if (!isNaN(inputValue) || inputValue === "") {
      setSample(inputValue);
    }
  };

  const handleSubmit = async () => {
    if (!data?.actual_start) {
      console.error("actual_start is missing or not yet loaded");
      return;
    }

    if (!group) {
      alert("Please provide a group name");
      return;
    }

    console.log("Speed: ", skuSpeed);

    const userConfirmed = window.confirm(
      `Are you sure the submitted data is correct?`
    );

    if (userConfirmed) {
      const fillingValue = parseInt(filling, 10) || 0;
      const packingValue = parseInt(packing, 10) || 0;
      const sampleValue = parseInt(sample, 10) || 0;

      // Calculate quality loss
      const totalRejects = fillingValue + packingValue + sampleValue;

      const qual = (totalRejects / (skuSpeed || 1)) * 60;
      if (isNaN(qual) || !isFinite(qual)) {
        console.error("Invalid qual calculation");
        return;
      }
      console.log("Qual: ", qual);

      setIsLoading(true);
      try {
        const shiftTime = getShift(shift, date);
        let startTime;
        const start = new Date(data?.actual_start);
        start.setHours(start.getHours() - 7);
        startTime = start < shiftTime.startTime ? shiftTime.startTime : start;
        const response = await fetch("/api/createQualLoss", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filling: fillingValue,
            packing: packingValue,
            sample: sampleValue,
            qual: qual || 0,
            value: value,
            actual_start: toLocalISO(startTime),
            group: group,
            plant: plant,
          }),
        });
        if (response.ok) {
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error("Error submitting quality loss data:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Submission canceled by user");
    }
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
                <h3 className="text-black font-semibold">Set Quality Loss</h3>
                <button
                  className="bg-transparent border-0 text-black float-right"
                  onClick={onClose}
                >
                  <span
                    className="text-black opacity-7 h-6 w-6 text-xl block py-0 rounded-full"
                    style={{ backgroundColor: "#A3D9A5" }}
                  >
                    x
                  </span>
                </button>
              </div>
              <div className="relative p-6 flex-auto w-full flex flex-col">
                <div className="grid grid-cols-4">
                  <div className="relative col-span-1 items-center justify-center w-full flex flex-col h-full">
                    <h2 className="text-black px-3 py-2">
                      {plant === "Cheese"
                        ? "Reject Vacuum: "
                        : "Reject Filling: "}
                    </h2>
                    <br></br>
                    <h2 className="text-black px-3 py-2">Reject Packing: </h2>
                    <br></br>
                    <h2 className="text-black px-3 py-2">Sample: </h2>
                  </div>
                  <div className="relative col-span-2 items-center justify-center w-full flex flex-col h-full">
                    <input
                      type="number"
                      name="quality"
                      id="quality"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={filling}
                      onChange={handleFilling}
                    />
                    <br></br>
                    <input
                      type="number"
                      name="quality"
                      id="quality"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={packing}
                      onChange={handlePacking}
                    />
                    <br></br>
                    <input
                      type="number"
                      name="quality"
                      id="quality"
                      className="border border-gray-300 px-3 py-2 text-black"
                      value={sample}
                      onChange={handleSample}
                    />
                  </div>
                  <div className="relative col-span-1 items-center justify-center w-full flex flex-col h-full">
                    <h2 className="text-black px-3 py-2">pcs</h2>
                    <br></br>
                    <h2 className="text-black px-3 py-2">pcs</h2>
                    <br></br>
                    <h2 className="text-black px-3 py-2">pcs</h2>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1"
                  type="button"
                  //add onclick for save default option
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className={`text-white ${
                    isLoading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 active:bg-yellow-700"
                  } font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1`}
                  type="button"
                  //add onclick for save default option
                  onClick={handleSubmit} //nanti diganti ke metode submit (connect ke backend)
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default QualityLoss;
