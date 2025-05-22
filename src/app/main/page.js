"use client";
import RectangleChart from "@/app/components/MainChart";
import RectangleContainer from "@/app/components/MainContainer";
import RectangleContainerProcessing from "@/app/components/MainContainerProcessing";
import RectangleTable from "@/app/components/MainTable";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import HistoryFinishGoodTable from "../components/HistoryFinishGoodTable";
import LoadingSpinner from "../components/loading";
import RectangleContainerCheese from "../components/MainContainerCheese";
import RectangleContainerPasteurizer from "../components/MainContainerPasteurizer";
import RectangleContainerYogurt from "../components/MainContainerYogurt";
import MainModal from "../components/MainModal";
import MainLayout from "../mainLayout";
import styles from "../styles";
import groupMaster from "./../groupmaster";

function MainPage() {
  const [time, setTime] = useState(new Date());
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const id = searchParams.get("id");
  const [data, setData] = useState(null);
  const [PO, setPO] = useState([]);
  const [shift, setShift] = useState("");
  const [group, setGroup] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [stoppage, setStoppage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState("");
  const [date, setCurrentDate] = useState(null);
  const router = useRouter();

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

  //===== untuk format judul atas Milk Filling Packing - LINE A - SHIFT II - 17-12-2024
  const formatDateTime2 = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    // const hours = String(date.getHours()).padStart(2, "0");
    // const minutes = String(date.getMinutes()).padStart(2, "0");
    // return `${year}-${month}-${day}T${hours}:${minutes}`;
    return `${day}-${month}-${year}`;
  };

  let dataTime = new Date(sessionStorage.getItem("date"));

  useEffect(() => {
    if (typeof window !== "undefined") {
      // const storedPlant = sessionStorage.getItem("plant");
      // const storedShift = sessionStorage.getItem("shift");
      // const storedLine = sessionStorage.getItem("line");

      // if (!storedLine || !storedShift || !storedPlant) {
      //   // Redirect to the login page if any of the required parameters are missing
      //   router.push("/login");
      // }

      // setPlant(storedPlant);
      // setLine(storedLine);
      // setShift(storedShift);
      setCurrentDate(formatDateTime2(dataTime));
    }
  }, []);

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

  const fetchData = async (id, value) => {
    try {
      const productionOrderRes = await fetch(`/api/getPObyId?id=${id}`, {
        cache: "no-store",
      });

      if (!productionOrderRes.ok) {
        throw new Error("Failed to fetch one or more data sources");
      }

      const productionData = await productionOrderRes.json();

      console.log("Retrieved PO from backend: ", productionData);

      const currentShift = sessionStorage.getItem("shift");
      const currentDate = sessionStorage.getItem("date");
      const shiftTimes = getShift(currentShift, currentDate);
      // Sort and set the production order data
      if (Array.isArray(productionData)) {
        const filteredData = productionData.filter((entry) => {
          if (entry.status === "Completed") {
            const entryStart = new Date(entry.actual_start);
            entryStart.setHours(entryStart.getHours() - 7); // Adjust timezone
            return (
              entryStart >= shiftTimes.startTime &&
              entryStart < shiftTimes.endTime
            );
          }
          return false; // Exclude entries with status other than "Completed"
        });

        console.log("Filtered PO: ", filteredData);

        if (filteredData.length > 0) {
          setData(filteredData);
        } else {
          console.warn(
            "No production data matches the current shift with 'Completed' status"
          );
          setData(productionData);
        }
      } else {
        console.warn(
          "Production data is not an array, setting it as-is:",
          productionData
        );
        setData([]);
      }

      let start, end;
      for (const entry of productionData) {
        setGroup(entry.group);
        if (
          !entry.actual_start ||
          isNaN(new Date(entry.actual_start).getTime())
        ) {
          console.error("Invalid actual_start value:", entry.actual_start);
          continue; // Skip invalid entry
        }

        let startTime = new Date(entry.actual_start);
        let endTime = entry.actual_end
          ? new Date(entry.actual_end)
          : new Date();
        const startUTCTime = new Date(
          startTime.setHours(startTime.getHours() - 7)
        );
        const endUTCTime = new Date(endTime.setHours(endTime.getHours() - 7));

        start =
          startUTCTime < shiftTimes.startTime
            ? shiftTimes.startTime
            : shiftTimes.startTime;
        end =
          endUTCTime < shiftTimes.endTime
            ? shiftTimes.endTime
            : shiftTimes.endTime;

        console.log(
          "Sent data for fetching: ",
          value,
          toLocalISO(start),
          toLocalISO(end) || getLocalISOString()
        );
        const stoppagesRes = await fetch(`/api/getStoppages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            line: value,
            date_start: toLocalISO(start),
            date_end: toLocalISO(end) || getLocalISOString(),
            plant: sessionStorage.getItem("plant"),
          }),
        });
        const stoppageData = await stoppagesRes.json();

        // Handle stoppage data
        if (stoppageData && stoppageData.length > 0) {
          const sortedData = stoppageData.sort(
            (a, b) => new Date(a.Date) - new Date(b.Date)
          );
          setStartTime(sortedData[0].Date);

          const lastActivity = sortedData[sortedData.length - 1];
          const lastActivityEnd = new Date(lastActivity.Date);
          lastActivityEnd.setMinutes(
            lastActivityEnd.getMinutes() + lastActivity.Minutes
          );
          setEndTime(lastActivityEnd.toISOString());
          setStoppage(stoppageData);
        } else {
          console.warn("No downtime found");
          setStartTime(null);
          setEndTime(null);
          setStoppage([]);
        }
      }
    } catch (error) {
      console.error("Error fetching downtime data:", error);
      alert("Error fetching downtime data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedPlant = sessionStorage.getItem("plant");
    const storedShift = sessionStorage.getItem("shift");
    const storedLine = sessionStorage.getItem("line");

    if (storedLine === null || storedShift === null || storedPlant === null) {
      router.push("/login");
      return;
    }

    setPlant(storedPlant);
    setLine(storedLine);
    setShift(storedShift);
    setCurrentDate(formatDateTime2(dataTime));

    if (id && value) {
      fetchData(id, value); // Only fetch when `id` is available
    }
  }, []);

  useEffect(() => {
    const fetchAndStoreData = async () => {
      try {
        const currentShift = sessionStorage.getItem("shift");
        const currentDate = sessionStorage.getItem("date");
        const shiftTimes = getShift(currentShift, currentDate);

        let start, end;
        for (const entry of data) {
          let startTime = new Date(entry.actual_start);
          let endTime = entry.actual_end
            ? new Date(entry.actual_end)
            : new Date();
          const startUTCTime = new Date(
            startTime.setHours(startTime.getHours() - 7)
          );
          const endUTCTime = entry.actual_end
            ? new Date(endTime.setHours(endTime.getHours() - 7))
            : new Date();

          start =
            startUTCTime < shiftTimes.startTime
              ? shiftTimes.startTime
              : shiftTimes.startTime;
          end =
            endUTCTime < shiftTimes.endTime
              ? shiftTimes.endTime
              : shiftTimes.endTime;

          console.log("Start time PO: ", startUTCTime);
          console.log("End time PO: ", endUTCTime);

          console.log(
            "Sent data to get all PO: ",
            value,
            toLocalISO(start),
            toLocalISO(end)
          );
          const shiftRes = await fetch(`/api/getAllShiftPO`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              line: value,
              date_start: toLocalISO(start),
              date_end: toLocalISO(end),
            }),
          });
          const result = await shiftRes.json();
          console.log("Retrieved PO Shift Data: ", result);
          if (result) {
            setPO(result || []);
          } else {
            console.warn("No data returned from the server.");
            setPO([]);
          }
        }
      } catch (error) {
        console.error("Error fetching production order data:", error);
        console.error(
          "Error Retrieving Production Order or Production Order in the same shift did not exist"
        );
      }
    };
    if (data) {
      fetchAndStoreData();
    }
  }, [value, getGreeting, data]);

  const matchedPO = PO.find((item) => item.id?.toString() === id?.toString());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second

    // Clean up the timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  const getCurrentShift = () => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 6 && hours < 14) return "I";
    if (hours >= 14 && hours < 22) return "II";
    return "III";
  };

  const currentShift = getCurrentShift();
  const shiftMismatch = shift !== currentShift;

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-4 bg-white">
          {showModal && <MainModal setShowModal={setShowModal} />}
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
              - SHIFT {shift} - {date} -{" "}
              {groupMaster[sessionStorage.getItem("idgroup")] ||
                sessionStorage.getItem("idgroup")}
              {shiftMismatch && (
                <span style={{ color: "red", fontWeight: "bold" }}>
                  {" "}
                  (Not Current Shift){" "}
                </span>
              )}
            </span>
            {/* <button className="px-2 py-1 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
                    onClick={() => setShowModal(true)}>
                    Change Line / Shift
                    </button> */}
            <button
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
                text-[#6BBF74] bg-white border border-[#6BBF74] shadow-sm
                hover:bg-[#6BBF74] hover:text-white hover:border-[#58A663]
                focus:ring-2 focus:ring-[#58A663] focus:outline-none
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
          <h1 className="text-black text-2xl text-center font-bold">{value}</h1>
          <div className="flex items-center space-x-4">
            <h3 className="text-black font-semibold">
              {id} {matchedPO?.sku && `(${matchedPO.sku})`}
            </h3>
          </div>
          <br></br>
          {isLoading ? (
            <p className="text-black">Loading...</p>
          ) : stoppage && PO && data ? (
            plant === "Milk Processing" ? (
              <RectangleContainerProcessing
                initialData={data}
                stoppageData={stoppage}
                allPO={PO}
                group={group}
                localTime={getLocalISOString()}
              />
            ) : plant === "Milk Filling Packing" ? (
              <RectangleContainer
                initialData={data}
                stoppageData={stoppage}
                allPO={PO}
                group={group}
                localTime={getLocalISOString()}
              />
            ) : plant === "Cheese" ? (
              <RectangleContainerCheese
                initialData={data}
                stoppageData={stoppage}
                allPO={PO}
                group={group}
                localTime={getLocalISOString()}
              />
            ) : plant === "Yogurt" && line !== "PASTEURIZER" ? (
              <RectangleContainerYogurt
                initialData={data}
                stoppageData={stoppage}
                allPO={PO}
                group={group}
                localTime={getLocalISOString()}
              />
            ) : plant === "Yogurt" && line === "PASTEURIZER" ? (
              <RectangleContainerPasteurizer
                initialData={data}
                stoppageData={stoppage}
                allPO={PO}
                group={group}
                localTime={getLocalISOString()}
              />
            ) : (
              <p className="text-black">Invalid {plant} plant</p>
            )
          ) : (
            <p className="text-black">Loading......</p>
          )}

          <br></br>
          <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
            <div className="w-full max-w-4xl">
              {isLoading && PO ? (
                <p className="text-black">Loading...</p>
              ) : (
                <RectangleChart
                  initialData={data}
                  localTime={getLocalISOString()}
                  allPO={PO}
                />
              )}
            </div>
          </div>
          <br></br>
          <div className="overflow-x-auto">
            <h3 className="text-black font-semibold">
              History Finish Good (1 last day from now)
            </h3>
            <HistoryFinishGoodTable />
          </div>
          <br></br>
          <div className="overflow-x-auto">
            <h3 className="text-black font-semibold">List of Downtime</h3>
            {stoppage ? (
              <RectangleTable stoppageData={stoppage} />
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </main>
      </MainLayout>
    </>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MainPage />
    </Suspense>
  );
};

export default Page;
