import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Draggable from "react-draggable";

const Quantity = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [qty, setQty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [group, setGroup] = useState("");
  const params = useSearchParams();
  const selectedMaterialStr = sessionStorage.getItem("materialData");
  const selectedMaterial = JSON.parse(selectedMaterialStr);
  const id = selectedMaterial?.[0]?.id;
  const value = params.get("value");
  const shift = sessionStorage.getItem("shift");
  const date = sessionStorage.getItem("date");
  const plant = sessionStorage.getItem("plant");

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
          throw new Error("Failed to fetch one or more quantity in a PO");
        }

        const productionData = await productionOrderRes.json();
        console.log("Retrieved Data: ", productionData);

        // Sort and set the production order data
        setData(productionData[0]);
        console.log("State after fetch:", data);

        productionData.forEach(async (entry) => {
          const getShiftTimes = getShift(shift, date);
          let startTime, endTime;

          const start = new Date(entry.actual_start);
          start.setHours(start.getHours() - 7);

          const end = entry.actual_end
            ? new Date(entry.actual_end)
            : new Date();
          if (entry.actual_end) {
            end.setHours(end.getHours() - 7);
          }

          startTime =
            start < getShiftTimes.startTime ? getShiftTimes.startTime : start;
          endTime = end < getShiftTimes.endTime ? end : getShiftTimes.endTime;
          console.log("Sent start time: ", startTime);
          console.log("Sent end time: ", endTime);
          const res = await fetch("/api/getFinishGood", {
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
            throw new Error("Failed to fetch quantity data");
          }

          const quantityData = await res.json();
          if (Array.isArray(quantityData) && quantityData.length > 0) {
            const total = quantityData.reduce(
              (sum, item) => sum + parseFloat(item.Downtime),
              0
            );
            setQty(total); // Set the total downtime
          }
          setGroup(entry.group);
        });

        // Handle stoppage data
      } catch {
        console.error("Error fetching data:", error);
        alert("Error fetching quantity data: " + error.message);
      }
    };

    if (id && value) {
      fetchData(); // Only fetch when `id` is available
    }
  }, [id, value]);

  const handleQuantityChange = (event) => {
    const inputValue = event.target.value;
    if (!isNaN(inputValue) || inputValue === "") {
      setQty(inputValue);
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

    const userConfirmed = window.confirm(
      `Are you sure you want to submit quantity data of ${qty} pcs?`
    );

    if (userConfirmed) {
      setIsLoading(true);
      try {
        const shiftTime = getShift(shift, date);
        let startTime;
        const start = new Date(data?.actual_start);
        start.setHours(start.getHours() - 7);
        startTime = start < shiftTime.startTime ? shiftTime.startTime : start;
        const response = await fetch("/api/createFinishGood", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qty: qty || 0,
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
        console.error("Error submitting quantity data:", error);
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
                <h3 className="text-black font-semibold">Set Quantity</h3>
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
                <div className="grid grid-cols-5">
                  <div className="relative col-span-2 items-center justify-center w-full flex flex-col h-full">
                    <h2 className="text-black mb-7">
                      Current Production Order:{" "}
                    </h2>
                    <h2 className="text-black">Quantity: </h2>
                  </div>
                  <div className="relative col-span-2 w-full flex flex-col h-full">
                    <h2 className="text-black mb-2">{id}</h2>
                    <input
                      type="number"
                      name="quantity"
                      id="quantity"
                      className="border border-gray-300 px-3 py-2 text-black mt-2"
                      value={qty}
                      onChange={handleQuantityChange}
                    />
                  </div>
                  <div className="relative col-span-1 items-center justify-center w-full flex flex-col h-full">
                    <br></br>
                    <h2 className="text-black mt-4">
                      {plant === "Milk Processing" ? "liter" : "pcs"}
                    </h2>
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
                  OK
                </button>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </>
  );
};

export default Quantity;
