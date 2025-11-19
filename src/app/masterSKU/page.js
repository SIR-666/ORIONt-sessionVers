"use client";
import Button2 from "@/app/components/Button2";
import LoadingSpinner from "@/app/components/loading";
import { mapLineName } from "@/utils/mapLineName";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import MasterSKUModal from "../components/masterSKUmoda";
import MainLayout from "../mainLayout";
import styles from "../styles";
import url from "../url";

function MasterSKUpage() {
  const [tableData, setTableData] = useState([]);
  const [loading, isLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [group, setGroup] = useState("");
  const [clicked, setClicked] = useState(false);
  const [shift, setShift] = useState("");
  const [date, setDate] = useState("");
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [tank, setTank] = useState("");
  const [fermentor, setFermentor] = useState("");
  const [time, setTime] = useState(new Date());
  const [deletingItems, setDeletingItems] = useState({});
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [editDowntimeData, setEditDowntimeData] = useState(null);
  const router = useRouter();

  const downtimeCategories = [
    "UHT",
    "ESL",
    "YGT",
    "MOZ",
    "RICO",
  ];

  const handleAddDowntime = () => {
    setEditDowntimeData(null);
    setShowDowntimeModal(true);
  };

  const handleEditDowntime = (item) => {
    setEditDowntimeData(item);
    setShowDowntimeModal(true);
  };

  const handleSaveDowntime = async (data) => {
    const payload = {
      ...data,
      line,
    };

    console.log("data: ",data);

    try {
      const urlApi = `http://localhost:3001/addSKU`;

      const res = await fetch(urlApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          payload
        ),
      });

      if (!res.ok) throw new Error("Failed to save data");

      alert("Saved successfully!");
      setShowDowntimeModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    }
  };

  const handleDeleteDowntime = async (id) => {
    // Confirm deletion before proceeding
    const confirmed = window.confirm(
      "Are you sure you want to delete this downtime?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${url.URL}/deleteMasterDowntime`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      });

      if (!response.ok) throw new Error("Failed to save data");

      alert("Deleted successfully!");
      setShowDowntimeModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete downtime");
    }
  };

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

    return { startTime, endTime };
  };

  useEffect(() => {
    console.log("SKU");
    const fetchData = async () => {
      try {
        const SKURes = await fetch(
          // `${url.URL}/getMasterDowntime?line=${storedLine}`,
          `http://localhost:3001/getAllSKU`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        // console.log("SKU res: ",SKURes);
        if (!SKURes.ok) {
          const errorResponse = await SKURes.json();
          throw new Error(errorResponse.error || "Failed to update order");
        }

        const SKUData = await SKURes.json();
        console.log("SKU data: ",SKUData);
        setTableData(Array.isArray(SKUData) ? SKUData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second

    // Clean up the timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  const deleteItemById = async (id, plant, line) => {
    try {
      setDeletingItems((prevState) => ({
        ...prevState,
        [id]: true, // Mark the item as being deleted
      }));

      const response = await fetch(`/api/deleteStoppages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, plant, line }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to update order");
      }

      const result = await response.json();
      if (result.success && result.rowsAffected > 0) {
        alert(`Deleted stoppage: ${result.rowsAffected} row(s) affected`);
      } else {
        alert("No rows were deleted");
      }
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete downtime");
    } finally {
      setDeletingItems((prevState) => ({
        ...prevState,
        [id]: false, // Mark the item as no longer being deleted
      }));
    }
  };

  const handleClick = (buttonIndex) => {
    if (clicked === buttonIndex) {
      // Kalau diklik lagi → hilangkan filter
      setClicked(false);
    } else {
      setClicked(buttonIndex);
    }
  };

  return loading ? (
    <LoadingSpinner />
  ) : (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white">
          <br></br>
          <br></br>
          
          <br></br>
          
          <br></br>
          <div className="container max-w-full mx-auto">
            <div className="relative flex items-center w-full h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden">
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
                id="filter"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Search something.."
              />
            </div>
          </div>
        </main>
        <button
          className="flex items-center justify-center px-4 py-3 mb-6 rounded-full text-sm font-medium transition-all duration-200 outline-none focus:outline-none shadow-sm bg-white text-[#6BBF74] border border-[#6BBF74] hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]"
          onClick={handleAddDowntime}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add SKU
        </button>
        <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
          <div className="relative w-full overflow-y-auto overflow-x-auto flex flex-col h-full px-5 py-4">
            <text className="text-lg font-semibold text-black mb-2">
              SKU
            </text>
            <table className="w-flex text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-6">
                    SKU
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Category
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Speed
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Line
                  </th>
                   <th scope="col" className="py-3 px-6">
                    Active
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData
                .filter((item) => {
                    if (!filterValue) return true;
                    const search = filterValue.toLowerCase();
                    return (
                      item.sku?.toLowerCase().includes(search) ||
                      item.category?.toLowerCase().includes(search) ||
                      item.speed?.toString().toLowerCase().includes(search) ||
                      item.line?.toLowerCase().includes(search) ||
                      item.flag?.toString().toLowerCase().includes(search)
                    );
                  })
                  .map((item, index) => {
                    

                    return (
                      <tr className="bg-white border-b" key={item.id}>
                        <td className="py-4 px-6">{item.sku}</td>
                        <td className="py-4 px-6">{item.category}</td>
                        <td className="py-4 px-6">{item.speed}</td>
                        <td className="py-4 px-6">{item.line}</td>
                        <td className="py-4 px-6">{item.flag}</td>
                        <td className="py-4 px-6">
                          {deletingItems[item.id] ? (
                            <span>Deleting...</span>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                className="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-yellow-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-yellow-600 hover:border-4 focus:border-4 hover:border-yellow-800 hover:text-yellow-800 focus:border-yellow-200 active:border-grey-900 active:text-grey-900"
                                onClick={() => handleEditDowntime(item)}
                              >
                                Edit
                              </button>
                              <button
                                className="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-red-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-red-600 hover:border-4 focus:border-4 hover:border-red-800 hover:text-red-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
                                onClick={() => handleDeleteDowntime(item.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        <MasterSKUModal
          isOpen={showDowntimeModal}
          onClose={() => setShowDowntimeModal(false)}
          onSave={handleSaveDowntime}
          initialData={editDowntimeData}
          categories={downtimeCategories}
          line={line}
        />
      </MainLayout>
    </>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MasterSKUpage />
    </Suspense>
  );
};

export default Page;
