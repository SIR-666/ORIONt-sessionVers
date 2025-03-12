"use client";
import Form from "@/app/components/AddStoppage";
import FormFill from "@/app/components/AddStoppageForm";
import FormType from "@/app/components/AddStoppageType";
import Button2 from "@/app/components/Button2";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { adjustDowntimes } from "../downtimeUtils";
import MainLayout from "../mainLayout";
import styles from "../styles";
import LoadingSpinner from "@/app/components/loading"

function StoppagePage() {
  const [tableData, setTableData] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [data, setData] = useState(null);
  const [PO, setPO] = useState(null);
  const [group, setGroup] = useState("");
  const [clicked, setClicked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const id = searchParams.get("id");
  const [shift, setShift] = useState("");
  const [date, setDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showForm1, setShowForm1] = useState(false);
  const [showForm2, setShowForm2] = useState(false);
  const [clickedRowData, setClickedRowData] = useState(null);
  const [clickedItemData, setClickedItemData] = useState({});
  const [plant, setPlant] = useState("");
  const [time, setTime] = useState(new Date());
  const [deletingItems, setDeletingItems] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const currentHour = time.getHours();
  // Conditional Greeting based on the current time
  const getGreeting = useCallback(() => {
    if (currentHour < 14 && currentHour >= 6) {
      return "I";
    } else if (currentHour < 22 && currentHour >= 14) {
      return "II";
    } else {
      return "III";
    }
  }, [currentHour]);

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
    // console.log("Shift start time: ", startTime);
    // console.log("Shift end time: ", endTime);

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
    const shift = localStorage.getItem("shift");
    const date = localStorage.getItem("date");

    // Panggil getShift dan simpan hasilnya
    const shiftData = getShift(shift, date);

    if (!shiftData) {
      console.error("Invalid shift data");
      return;
    }

    const { startTime, endTime } = shiftData;

    const fetchData = async () => {
      try {
        const line = localStorage.getItem("line");
        setGroup(localStorage.getItem("group"));

        const stoppagesRes = await fetch(`/api/getStoppages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            line: line,
            date_start: toLocalISO(startTime),
            date_end: toLocalISO(endTime),
            plant: localStorage.getItem("plant"),
          }),
        });

        console.log("Stoppage data: ", stoppagesRes);

        if (!stoppagesRes.ok) {
          const errorResponse = await stoppagesRes.json();
          throw new Error(errorResponse.error || "Failed to update order");
        }

        const stoppageData = await stoppagesRes.json();
        setTableData(Array.isArray(stoppageData) ? stoppageData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    console.log("Fetched data: ", tableData);
  }, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const productionOrderRes = await fetch(`/api/getPObyId?id=${id}`);

  //       if (!productionOrderRes.ok) {
  //         throw new Error("Failed to fetch one or more data sources");
  //       }

  //       const productionData = await productionOrderRes.json();

  //       console.log("Retrieved PO from backend: ", productionData);

  //       // Sort and set the production order data
  //       setPO(productionData);
  //       const currentShift = localStorage.getItem("shift");
  //       const currentDate = localStorage.getItem("date");
  //       const shiftTimes = getShift(currentShift, currentDate);

  //       let start, end;
  //       productionData.forEach(async (entry) => {
  //         let startTime = new Date(entry.actual_start);
  //         let endTime = entry.actual_end
  //           ? new Date(entry.actual_end)
  //           : new Date();
  //         const startUTCTime = new Date(
  //           startTime.setHours(startTime.getHours() - 7)
  //         );
  //         const endUTCTime = new Date(endTime.setHours(endTime.getHours() - 7));

  //         start =
  //           startUTCTime < shiftTimes.startTime
  //             ? shiftTimes.startTime
  //             : shiftTimes.startTime;
  //         end =
  //           endUTCTime < shiftTimes.endTime
  //             ? shiftTimes.endTime
  //             : shiftTimes.endTime;
  //         // let localTime = startTime.getUTCHours();
  //         // if (localTime >= 6 && localTime < 14) {
  //         //   // Shift I: 6:00 AM to 2:00 PM
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(6, 0, 0, 0); // Set start to 6:00 AM
  //         //   end = new Date(startTime);
  //         //   end.setUTCHours(14, 0, 0, 0); // Set end to 2:00 PM
  //         // } else if (localTime >= 14 && localTime < 22) {
  //         //   // Shift II: 2:00 PM to 10:00 PM
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(14, 0, 0, 0); // Set start to 2:00 PM
  //         //   end = new Date(startTime);
  //         //   end.setUTCHours(22, 0, 0, 0); // Set end to 10:00 PM
  //         // } else if (localTime >= 22 || localTime < 6) {
  //         //   // Shift III: 10:00 PM to 6:00 AM (spans two days)
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(22, 0, 0, 0); // Set start to 10:00 PM

  //         //   end = new Date(startTime);
  //         //   if (localTime >= 22) {
  //         //     // If current time is 10:00 PM or later, set end to 6:00 AM the next day
  //         //     end.setDate(end.getDate() + 1);
  //         //   } else if (localTime < 6) {
  //         //     start.setDate(start.getDate() - 1);
  //         //   }
  //         //   end.setUTCHours(6, 0, 0, 0);
  //         // }

  //         console.log(
  //           "Sent data for fetching: ",
  //           value,
  //           toLocalISO(start),
  //           toLocalISO(end) || getLocalISOString()
  //         );
  //         setGroup(entry.group);
  //         const stoppagesRes = await fetch(`/api/getStoppages`, {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             line: value,
  //             date_start: toLocalISO(start),
  //             date_end: toLocalISO(end) || getLocalISOString(),
  //           }),
  //         });

  //         if (!stoppagesRes.ok) {
  //           const errorResponse = await stoppagesRes.json();
  //           throw new Error(errorResponse.error || "Failed to update order");
  //         }

  //         const stoppageData = await stoppagesRes.json();
  //         setTableData(Array.isArray(stoppageData) ? stoppageData : []);
  //       });

  //       // const stoppagesRes = await fetch(`/api/getStoppages`, {
  //       //   method: "POST",
  //       //   headers: {
  //       //     "Content-Type": "application/json",
  //       //   },
  //       //   body: JSON.stringify({
  //       //     line: value,
  //       //     date_start: toLocalISO(start),
  //       //     date_end: toLocalISO(end) || getLocalISOString(),
  //       //   }),
  //       // });

  //       // if (!stoppagesRes.ok) {
  //       //   const errorResponse = await stoppagesRes.json();
  //       //   throw new Error(errorResponse.error || "Failed to update order");
  //       // }

  //       // const stoppageData = await stoppagesRes.json();
  //       // setTableData(Array.isArray(stoppageData) ? stoppageData : []);
  //     } catch (error) {
  //       console.error("Error:", error);
  //       // alert("Error getting stoppages: " + error.message);
  //       alert(
  //         "Silahkan pilih Production Order terlebih dahulu: " + error.message
  //       );
  //       setTableData([]);
  //     }
  //   };
  //   fetchData();
  // }, [value]);

  // useEffect(() => {
  //   const fetchAllPO = async () => {
  //     try {
  //       const currentShift = localStorage.getItem("shift");
  //       const currentDate = localStorage.getItem("date");
  //       const shiftTimes = getShift(currentShift, currentDate);
  //       let start, end;
  //       const promises = PO.map(async (entry) => {
  //         let startTime = new Date(entry.actual_start);
  //         let endTime = entry.actual_end
  //           ? new Date(entry.actual_end)
  //           : new Date();
  //         const startUTCTime = new Date(
  //           startTime.setHours(startTime.getHours() - 7)
  //         );
  //         const endUTCTime = new Date(endTime.setHours(endTime.getHours() - 7));

  //         start =
  //           startUTCTime < shiftTimes.startTime
  //             ? shiftTimes.startTime
  //             : shiftTimes.startTime;
  //         end =
  //           endUTCTime < shiftTimes.endTime
  //             ? shiftTimes.endTime
  //             : shiftTimes.endTime;
  //         // let localTime = startTime.getUTCHours();
  //         // console.log("utc time: ", localTime);
  //         // if (localTime >= 6 && localTime < 14) {
  //         //   // Shift I: 6:00 AM to 2:00 PM
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(6, 0, 0, 0); // Set start to 6:00 AM
  //         //   end = new Date(startTime);
  //         //   end.setUTCHours(14, 0, 0, 0); // Set end to 2:00 PM
  //         // } else if (localTime >= 14 && localTime < 22) {
  //         //   // Shift II: 2:00 PM to 10:00 PM
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(14, 0, 0, 0); // Set start to 2:00 PM
  //         //   end = new Date(startTime);
  //         //   end.setUTCHours(22, 0, 0, 0); // Set end to 10:00 PM
  //         // } else if (localTime >= 22 || localTime < 6) {
  //         //   // Shift III: 10:00 PM to 6:00 AM (spans two days)
  //         //   start = new Date(startTime);
  //         //   start.setUTCHours(22, 0, 0, 0); // Set start to 10:00 PM

  //         //   end = new Date(startTime);
  //         //   if (localTime >= 22) {
  //         //     // If current time is 10:00 PM or later, set end to 6:00 AM the next day
  //         //     end.setDate(end.getDate() + 1);
  //         //   } else if (localTime < 6) {
  //         //     start.setDate(start.getDate() - 1);
  //         //   }
  //         //   end.setUTCHours(6, 0, 0, 0);
  //         // }

  //         console.log("Date start: ", toLocalISO(start));
  //         console.log("Date end: ", toLocalISO(end));
  //         const shiftRes = await fetch(`/api/getAllShiftPO`, {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({
  //             line: value,
  //             date_start: toLocalISO(start),
  //             date_end: toLocalISO(end),
  //           }),
  //         });

  //         if (!shiftRes.ok) {
  //           throw new Error("Failed to fetch all PO data");
  //         }

  //         let result;
  //         try {
  //           result = await shiftRes.json();
  //         } catch (error) {
  //           console.warn("Failed to parse JSON response:", error);
  //           result = []; // Set to empty array if JSON parsing fails
  //         }

  //         // console.log('Received Production Order from backend:', result);
  //         return result;
  //       });

  //       const allResults = await Promise.all(promises);
  //       setData(allResults.flat());
  //     } catch (error) {
  //       console.error("Error fetching production orders:", error);
  //       // Optionally set data to an empty array or string to ensure it doesn't interfere
  //       setData([]);
  //     }
  //   };
  //   if (value && PO) {
  //     // Ensure value exists before attempting fetch
  //     fetchAllPO();
  //   }
  // }, [value, PO]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second

    // Clean up the timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("plant");
      const storedShift = localStorage.getItem("shift");
      const storedDate = localStorage.getItem("date");
      const storedGroup = localStorage.getItem("group");
      setPlant(storedData ? storedData.replace(/["']/g, "") : "");
      setShift(storedShift);
      setDate(storedDate);
      setGroup(storedGroup);
    }
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, "0")}/${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const updateItemById = async (id) => {
    try {
      const response = await fetch(`/api/getDowntimeId?id=${id}`);
      const downtime = await response.json();
      console.log("Downtime Data (Editing): ", downtime);
      setEditData(downtime);
      setIsEditing(true);
      setShowForm2(true);
    } catch (error) {
      console.error("Error fetching downtime:", error);
    }
  };

  useEffect(() => {
    console.log("Is editing (parent):", isEditing);
  }, [isEditing]);

  const deleteItemById = async (id, plant) => {
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
        body: JSON.stringify({ id, plant }),
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

  const adjustedDowntimes = useMemo(() => {
    const result = adjustDowntimes(tableData, data, value.toUpperCase());

    console.log("Sent Stoppage data:", tableData);
    console.log("Sent PO data:", data);
    return result.filter((item) =>
      Object.values(item).some((val) =>
        val?.toString().toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  }, [tableData, data, value, filterValue]);

  // console.log("Retrieved Downtime based on PO: ", adjustedDowntimes);

  const handleClick = (buttonIndex) => {
    setClicked(buttonIndex);
  };

  const handleRowClick = (rowData) => {
    setClickedRowData(rowData);
    setShowModal(false);
    setShowForm1(true);
  };

  const handleBackButton = () => {
    setShowForm1(false);
    setShowModal(true);
  };

  const handleTypeButton = (itemData, machineName) => {
    setClickedItemData({ itemData, machineName });
    setShowForm1(false);
    setShowForm2(true);
  };

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white">
          {showModal && (
            <Form setShowModal={setShowModal} onRowClick={handleRowClick} />
          )}
          {showForm1 && (
            <FormType
              setShowForm1={setShowForm1}
              onBackButtonClick={handleBackButton}
              onItemClick={handleTypeButton}
              clickedData={clickedRowData}
            />
          )}
          {showForm2 && (
            <FormFill
              setShowForm2={setShowForm2}
              clickedData={clickedRowData}
              isEditing={isEditing}
              edit={setIsEditing}
              editData={editData}
              clickedItem={clickedItemData}
              shift={getGreeting()}
              po={PO}
              group={group}
            />
          )}
          <br></br>
          <br></br>
          <div style={styles.container}>
            <span style={styles.mainText}>
              {plant} - {value.toUpperCase()} - SHIFT {shift} - {date} -{" "}
              {localStorage.getItem("group")}
            </span>
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
          <div className="flex grid-cols-4 gap-4 mr-60">
            <Button2
              label="Minor Stop"
              isActive={clicked === 1}
              onClick={() => handleClick(1)}
            />
            <Button2
              label="All Downtime"
              isActive={clicked === 2}
              onClick={() => handleClick(2)}
            />
            <Button2
              label="Line Stop"
              isActive={clicked === 3}
              onClick={() => handleClick(3)}
            />
            <Button2
              label="Not Occupied"
              isActive={clicked === 4}
              onClick={() => handleClick(4)}
            />
          </div>
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
        <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
          <div className="relative w-full overflow-y-auto overflow-x-auto flex flex-col h-full px-5 py-4">
            <table className="w-flex text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-6">
                    Downtime ID
                  </th>
                  {/* <th scope="col" className="py-3 px-6">
                    Production Order (PO)
                  </th> */}
                  <th scope="col" className="py-3 px-6">
                    Machine
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Stoppage Type
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Start Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    End Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Duration (Minutes)
                  </th>
                  {/* <th scope="col" className="py-3 px-6">Impacts Line</th> */}
                  <th scope="col" className="py-3 px-6">
                    Comments
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Category
                  </th>
                  {/* <th scope="col" className="py-3 px-6">Crew Size</th>
                    <th scope="col" className="py-3 px-6">Standard Duration</th>
                    <th scope="col" className="py-3 px-6">Multiplier</th> */}
                  <th scope="col" className="py-3 px-6">
                    Group
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Last Reported
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => {
                  const downtimeEnd = new Date(item.Date);
                  downtimeEnd.setMinutes(
                    downtimeEnd.getMinutes() + parseInt(item.Minutes)
                  );

                  return (
                    <tr
                      className="bg-white border-b"
                      key={`${item.id}-${index}`}
                    >
                      <td className="py-4 px-6">{item.id}</td>
                      {/* <td className="py-4 px-6">{item.orderId}</td> */}
                      <td className="py-4 px-6">{item.Mesin}</td>
                      <td className="py-4 px-6">{item.Jenis}</td>
                      <td className="py-4 px-6">{formatDateTime(item.Date)}</td>
                      <td className="py-4 px-6">
                        {formatDateTime(downtimeEnd)}
                      </td>
                      {/* <td className="py-4 px-6">{formatDateTime(item.endTime)}</td> */}
                      <td className="py-4 px-6">{item.Minutes}</td>
                      {/* <td className="py-4 px-6">X</td> */}
                      <td className="py-4 px-6">{item.Keterangan}</td>
                      <td className="py-4 px-6">{item.Downtime_Category}</td>
                      {/* <td className="py-4 px-6">7.20</td>
                            <td className="py-4 px-6">00:00:00</td>
                            <td className="py-4 px-6">1</td> */}
                      <td className="py-4 px-6">{item.Group}</td>
                      <td className="py-4 px-6">
                        {formatDateTime(item.datesystem)}
                      </td>
                      <td className="py-4 px-6">
                        {/* Show "Deleting..." if the item is being deleted */}
                        {deletingItems[item.id] ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <button
                              className="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-yellow-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-yellow-600 hover:border-4 focus:border-4 hover:border-yellow-800 hover:text-yellow-800 focus:border-yellow-200 active:border-grey-900 active:text-grey-900"
                              onClick={() => updateItemById(item.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-red-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-red-600 hover:border-4 focus:border-4 hover:border-red-800 hover:text-red-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
                              onClick={() =>
                                deleteItemById(
                                  item.id,
                                  localStorage.getItem("plant")
                                )
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <br></br>
        {/* <button 
        className="flex items-center justify-center px-4 py-3 mb-7 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
        onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Downtime
        </button> */}
        <button
          className={`
    flex items-center justify-center px-4 py-3 mb-7 rounded-full text-sm font-medium
    transition-all duration-200 outline-none focus:outline-none shadow-sm
    bg-white text-[#6BBF74] border border-[#6BBF74] 
    hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
    focus:ring-2 focus:ring-[#58A663] active:bg-[#4F9A5F] active:border-[#4F9A5F]
  `}
          onClick={() => setShowModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor" // Menggunakan warna teks button
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Downtime
        </button>
      </MainLayout>
    </>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StoppagePage />
    </Suspense>
  );
};

export default Page;
