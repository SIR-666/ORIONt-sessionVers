"use client";

import MainLayout from "@/app/mainLayout";
import { canEditData } from "@/utils/canEditData";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../styles";
import ProdFill from "./AddPOForm";
import Button from "./Button";
import Edit from "./EditPO";
import End from "./EndPO";
import Modal from "./Modal";
import Start from "./StartPO";

export default function OrderPage({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [filteredData, setFilteredData] = useState(initialData || []);
  const [lineData, setLineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const shift = searchParams.get("shift");
  const date = searchParams.get("date");
  const role = searchParams.get("role");
  const [search, setSearch] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showForm1, setShowForm1] = useState(false);
  const [showForm2, setShowForm2] = useState(false);
  const [clickedItemData, setClickedItemData] = useState(null);
  const [time, setTime] = useState(new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clean up the timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = sessionStorage.getItem("plant");
      setPlant(storedData ? storedData.replace(/["']/g, "") : "");
      const storedLine = sessionStorage.getItem("line");
      setLine(storedLine);
    }
  }, []);

  const formatDateTime3 = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
      return "";
    }
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);
    return `${date.getUTCDate().toString().padStart(2, "0")}-${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getUTCFullYear()} ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}`;
  };

  const getItemById = (id) => {
    const item = data.find((entry) => entry.id === id);
    console.log("Item data: ", item);
    if (item) {
      sessionStorage.setItem("selectedMaterial", JSON.stringify([item]));
      console.log("value: ", value);
      console.log("id: ", id);
      console.log("group: ", item.group);
      sessionStorage.setItem("idgroup", item.group);
      sessionStorage.setItem("line", value);
      router.push(`/main?value=${value}&id=${id}`);
    }
  };

  const fetchAndStoreData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/getAllPO?value=${value}&shift=${shift}&date=${date}&plant=${plant}`
      ); // Replace with actual endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch production order data");
      }

      const latestData = await response.json();

      // Update component state
      setData(latestData);
      console.log("data : ", latestData);
      setFilteredData(latestData);

      // Store the latest data in sessionStorage for offline use
      // sessionStorage.setItem("materialData", JSON.stringify(latestData));
      sessionStorage.setItem("materialData", JSON.stringify(latestData));

      return latestData; // Return data if needed elsewhere
    } catch (error) {
      console.error("Error fetching production order data:", error);
      alert("Error retrieving production order data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = data;

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter((row) =>
        Object.values(row).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    setFilteredData(filtered);
  }, [statusFilter, search, data]);

  useEffect(() => {
    const getPOLine = async () => {
      try {
        const response = await fetch(`/api/getPOLine?value=${value}`); // Replace with actual endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch production order data");
        }

        const latestData = await response.json();
        setLineData(latestData);
      } catch (error) {
        console.error("Error fetching production order data:", error);
        alert("Error retrieving production order data by line");
      }
    };

    if (value) {
      getPOLine();
    }
  }, [value]);

  const statusMapping = {
    "^PROCESSING.*": "Release", // Regex pattern for keys starting with 'PROCESSING'
    "^RELEASE.*": "Release", // Regex pattern for keys starting with 'RELEASE'
  };

  function getStatus(status) {
    for (const pattern in statusMapping) {
      const regex = new RegExp(pattern);
      if (regex.test(status)) {
        return statusMapping[pattern];
      }
    }
    return "Unknown"; // Fallback for unmatched statuses
  }

  const handleClick = (status) => {
    setStatusFilter(status);
  };

  const openStartModal = (id, status) => {
    for (const entry of lineData) {
      if (entry.status === "Active") {
        alert(
          `Please stop active Production Order first with the id of ${entry.id}`
        );
        return;
      }
    }
    setSelectedId(id);
    setSelectedStatus(status);
    setShowStart(true);
  };

  const handleNoPoModal = () => {
    for (const entry of lineData) {
      if (entry.status === "Active") {
        alert(
          `Please stop active Production Order first with the id of ${entry.id}`
        );
        return;
      }
    }
    setShowForm2(true);
  };

  const stopPO = (id, status) => {
    setSelectedId(id);
    setSelectedStatus(status);
    setShowEnd(true);
  };

  const editPO = (id, status) => {
    setSelectedId(id);
    setSelectedStatus(status);
    setShowEdit(true);
  };

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white">
          {showModal && <Modal setShowModal={setShowModal} />}
          {showForm2 && (
            <ProdFill
              setShowForm2={setShowForm2}
              onUpdate={fetchAndStoreData}
              value={value}
              shift={shift}
            />
          )}
          {showStart && (
            <Start
              setShowStart={setShowStart}
              id={selectedId}
              status={selectedStatus}
              onSubmit={getItemById}
              onUpdate={fetchAndStoreData}
              data={data}
              lineData={lineData}
            />
          )}
          {showEnd && (
            <End
              setShowEnd={setShowEnd}
              id={selectedId}
              status={selectedStatus}
              onUpdate={fetchAndStoreData}
              data={data}
            />
          )}
          {showEdit && (
            <Edit
              setShowEdit={setShowEdit}
              id={selectedId}
              status={selectedStatus}
              onUpdate={fetchAndStoreData}
              data={data}
            />
          )}
          <br></br>
          <br></br>
          <div style={styles.container}>
            <span style={styles.mainText}>
              {plant} - {value.toUpperCase()}{" "}
              {plant === "Milk Processing"
                ? `- ${sessionStorage.getItem("tank")}`
                : ""}{" "}
              {plant === "Yogurt" && value === "PASTEURIZER"
                ? `- ${sessionStorage.getItem("fermentor")}`
                : ""}{" "}
              - SHIFT {shift} - {date} - {sessionStorage.getItem("group")}
            </span>
            <button
              className={`
                    px-4 py-2 rounded-full text-sm font-medium text-[#6BBF74] bg-white 
                    border border-[#6BBF74] shadow-sm transition-all duration-200 
                    hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                    focus:outline-none focus:ring-2 focus:ring-[#58A663] 
                    active:bg-[#4F9A5F] active:border-[#4F9A5F]
                `}
              onClick={() => setShowModal(true)}
            >
              Change Line / Shift
            </button>

            <span style={styles.dateText} suppressHydrationWarning>
              {time
                .toLocaleDateString("en-GB", { weekday: "long" })
                .toUpperCase()}
              ,{" "}
              {time
                .toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
                .toUpperCase()}{" "}
              {time.toLocaleTimeString("en-GB")}
            </span>
          </div>
          <br></br>
          <div className="container grid grid-cols-2 gap-20 mx-auto"></div>
          <br></br>
          <div className="flex grid-cols-4 gap-4 mr-60">
            <Button
              label="New"
              isActive={
                statusFilter === "Release SAP" || statusFilter === "Release"
              }
              onClick={() => handleClick("Release SAP")}
            />
            <Button
              label="All"
              isActive={statusFilter === "All"}
              onClick={() => handleClick("All")}
            />
            <Button
              label="Active"
              isActive={statusFilter === "Active"}
              onClick={() => handleClick("Active")}
            />
            <Button
              label="Completed"
              isActive={statusFilter === "Completed"}
              onClick={() => handleClick("Completed")}
            />
          </div>
          <br></br>
          <div className="flex grid-cols-3 gap-4 w-full">
            <div className="col-span-1 relative flex items-center w-full h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden">
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
                placeholder="Search something.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-span-1 relative flex items-center h-12 rounded-full"></div>
          </div>
        </main>
        {loading ? (
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              <p className="text-black">Loading...</p>
            </span>
          </div>
        ) : (
          <div className="relative w-full h-96 rounded-xl bg-white shadow-xl">
            <div className="relative w-full overflow-y-auto flex flex-col h-full px-5 py-4">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3 px-6">
                      Material
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Quantity{" "}
                      {plant === "Milk Processing" || line === "PASTEURIZER"
                        ? "(liter)"
                        : "(pcs)"}
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Actual Start/End Time
                    </th>
                    <th scope="col" className="py-3 px-6">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr className="bg-white border-b" key={row.id}>
                      <td className="py-4 px-6 font-medium text-lg">
                        {row.sku || row.MATERIAL}
                      </td>
                      <td className="py-4 px-6 font-medium text-lg">
                        {row["TOTAL QUANTITY / GR"]?.replace(
                          /(?<=,\d+)\.000$/,
                          ""
                        ) ??
                          new Intl.NumberFormat("id-ID").format(row.qty || 0)}
                      </td>
                      <td className="py-4 px-6 font-medium text-lg">
                        {row.status || getStatus(row.STATUS) || row.STATUS}
                      </td>
                      <td className="py-4 px-6 font-medium text-lg">
                        <p>{formatDateTime3(row.actual_start)}</p>
                        <p>{formatDateTime3(row.actual_end)}</p>
                      </td>
                      <td className="py-4 px-6">
                        {row.status === "New" ? (
                          <button
                            className={`
                                    flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                                    text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                                    transition-all duration-200 focus:outline-none 
                                    hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                                    focus:ring-2 focus:ring-[#58A663] 
                                    active:bg-[#4F9A5F] active:border-[#4F9A5F]
                                  `}
                            onClick={() => openStartModal(row.id, row.status)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="size-6 mr-2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                              />
                            </svg>
                            Start
                          </button>
                        ) : row.status === "Active" ? (
                          <div>
                            <button
                              className={`
                            flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                            text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                            transition-all duration-200 focus:outline-none 
                            hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                            focus:ring-2 focus:ring-[#58A663] 
                            active:bg-[#4F9A5F] active:border-[#4F9A5F]
                        `}
                              onClick={() => stopPO(row.id, row.status)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-6 mr-2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
                                />
                              </svg>
                              Stop
                            </button>
                            <button
                              className={`
                                flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                                text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                                transition-all duration-200 focus:outline-none 
                                hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                                focus:ring-2 focus:ring-[#58A663] 
                                active:bg-[#4F9A5F] active:border-[#4F9A5F]
                            `}
                              onClick={() => getItemById(row.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-6 mr-2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                                />
                              </svg>
                              Details
                            </button>
                          </div>
                        ) : row.status === "Completed" ? (
                          <div>
                            <button
                              className={`
                                flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                                text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                                transition-all duration-200 focus:outline-none 
                                hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                                focus:ring-2 focus:ring-[#58A663] 
                                active:bg-[#4F9A5F] active:border-[#4F9A5F]
                            `}
                              onClick={() => editPO(row.id, row.status)}
                              disabled={!canEditData(date, role)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-6 mr-2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              className={`
                                flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                                text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                                transition-all duration-200 focus:outline-none 
                                hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                                focus:ring-2 focus:ring-[#58A663] 
                                active:bg-[#4F9A5F] active:border-[#4F9A5F]
                            `}
                              onClick={() => getItemById(row.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-6 mr-2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                                />
                              </svg>
                              Details
                            </button>
                          </div>
                        ) : getStatus(row.STATUS) === "Release SAP" ||
                          getStatus(row.STATUS) === "Release" ? (
                          <button
                            className={`
                            flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium
                            text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                            transition-all duration-200 focus:outline-none 
                            hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                            focus:ring-2 focus:ring-[#58A663] 
                            active:bg-[#4F9A5F] active:border-[#4F9A5F]
                            `}
                            onClick={() =>
                              openStartModal(
                                row["NO PROCESS ORDER"],
                                getStatus(row.STATUS)
                              )
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="size-6 mr-2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                              />
                            </svg>
                            Start
                          </button>
                        ) : (
                          <button disabled>Unknown</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <br></br>
        <button
          className={`
                flex items-center justify-center px-4 py-3 mb-7 rounded-full text-sm font-medium 
                text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                transition-all duration-200 focus:outline-none 
                hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                focus:ring-2 focus:ring-[#58A663]
                active:bg-[#4F9A5F] active:border-[#4F9A5F]
                disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed
            `}
          onClick={() => handleNoPoModal()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
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
          Create Empty PO
        </button>
      </MainLayout>
    </>
  );
}
