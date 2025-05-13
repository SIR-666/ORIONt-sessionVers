import nominalSpeeds from "@/app/speed";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import url from "../url";
import {
  calculateAvailableTime,
  calculateMtbf,
  calculateNet,
  calculateNReported,
  calculateOperation,
  calculatePercentages,
  calculateProduction,
  calculateRunning,
} from "./Calculations";
import QualityLossProcessing from "./QualLossProcessing";
import Quantity from "./Quantity";
import Speed from "./SpeedLoss";
import { calculateUnavailableTime } from "./UnavailableTime";

const RectangleContainerProcessing = ({
  initialData,
  stoppageData,
  allPO,
  group,
  localTime,
}) => {
  const TdBaseStyle = `text-black font-bold border-b border-l border-[#E8E8E8] dark:bg-dark-3 dark:border-dark dark:text-dark-7 py-2 px-2 text-center text-base font-medium`;
  const TdStyle = {
    TdStyle: `${TdBaseStyle} bg-[#99CD6F]`,
    TdStyleH: `${TdBaseStyle} bg-[#B3EE84]`,
    TdStyle2: `${TdBaseStyle} bg-[#488E2F]`,
    TdStyle3: `${TdBaseStyle} bg-[#A3FF98]`,
    TdStyle4: `${TdBaseStyle} bg-[#00FF19]`,
    TdStyleG: `${TdBaseStyle} bg-[#E1E1E1]`,
    TdStyleGr: `${TdBaseStyle} bg-[#63D759]`,
    TdStyle5: `${TdBaseStyle} bg-[#FFF72D]`,
    TdStyle6: `${TdBaseStyle} bg-[#F1A718]`,
    TdStyle7: `${TdBaseStyle} bg-[#DD631F] cursor-pointer`,
    TdStyle8: `${TdBaseStyle} bg-[#E92CF9]`,
    TdStyle9: `${TdBaseStyle} bg-[#F9EF98]`,
    TdStyle10: `${TdBaseStyle} bg-[#FF0000] cursor-pointer`,
    TdStyle11: `${TdBaseStyle} bg-[#D0A842]`,
  };

  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const id = searchParams.get("id");
  const [endTime, setEndTime] = useState("");
  const [timeDifference, setTimeDifference] = useState(null);
  const [durationSums, setDurationSums] = useState({
    PlannedStoppages: 0,
    UnplannedStoppages: 0,
    SpeedLoss: 0,
    UnavailableTime: 0,
    ProcessWaiting: 0,
  });
  const [qty, setQty] = useState(0);
  const [rejectQty, setrejectQty] = useState(0);
  const [qtyPO, setQtyPO] = useState([]);
  const [productIds, setProductIds] = useState([]);
  const [calendarMinutes, setCalendarMinutes] = useState(0);
  const [skuSpeed, setSKUSpeed] = useState(null);
  const [skuSpeeds, setSkuSpeeds] = useState({});
  const [qualityLoss, setQualityLoss] = useState(0);
  const [speedLoss, setSpeedLoss] = useState(0);
  const [qtyModal, setQtyModal] = useState(false);
  const [qualityLossModal, setQualityLossModal] = useState(false);
  const [speedLossModal, setSpeedLossModal] = useState(false);
  const [latestStart, setLatestStart] = useState(null);
  const [plant, setPlant] = useState(localStorage.getItem("plant"));
  const [breakdownMachine, setBreakdownMachine] = useState([]);
  // Variables to hold total net and netDisplay
  let totalnet = 0;
  let totalnetDisplay = 0;

  const formattedLineName = value.replace(/\s+/g, "_").toUpperCase();

  // Access the nominal speed from the map
  const handleSpeed = async () => {
    let speed;

    if (initialData && initialData.length > 0) {
      try {
        const fetchPromises = initialData.map((entry) =>
          fetch(`/api/getSpeedSKU`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sku: entry.sku }),
          }).then((response) => response.json())
        );

        const results = await Promise.all(fetchPromises);
        const speeds = results
          .map((skuData, index) => {
            if (skuData && typeof skuData[0]?.speed === "number") {
              return skuData[0].speed; // Return valid speed values only
            } else {
              console.warn(`No speed found for SKU ${initialData[index].sku}`);
              return null;
            }
          })
          .filter((speed) => speed !== null); // Filter out null values

        // Combine or use the speeds array as needed, e.g., return the first value:
        speed =
          speeds.length > 0 ? speeds[0] : nominalSpeeds[formattedLineName]; // Replace with your logic
      } catch (error) {
        console.error("Error fetching SKU nominal speed:", error);
        speed = null;
      }
    }

    return speed;
  };

  useEffect(() => {
    const line = localStorage.getItem("line");
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const machinesRes = await fetch(
          `${url.URL}/getMachineDowntime?line=${line}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!machinesRes.ok) {
          const errorResponse = await machinesRes.json();
          throw new Error(errorResponse.error || "Failed to get machine data");
        }

        const machineData = await machinesRes.json();
        setBreakdownMachine(Array.isArray(machineData) ? machineData : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();

    // Cleanup fetch if component unmount
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching speed...");
        const speed = await handleSpeed();
        console.log("Setting SKU speed to:", speed);
        setSKUSpeed(speed);

        // Ambil semua product_id dari allPO
        const productIds = allPO.map((entry) => entry.product_id);
        if (productIds.length > 0) {
          setProductIds(productIds);
          const response = await fetch(
            `/api/getProducts?ids=${productIds.join(",")}`
          );
          const data = await response.json();

          // Buat objek dengan key = product_id dan value = speed
          const speedsMap = {};
          data.forEach((product) => {
            speedsMap[product.id] =
              product.speed || nominalSpeeds[formattedLineName];
          });

          console.log("Setting SKU speeds to:", speedsMap);
          setSkuSpeeds(speedsMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [allPO]);

  // Calculate downtime in table
  useEffect(() => {
    const calculateSums = (data) => {
      let plannedSum = 0;
      let unplannedSum = 0;
      let unavailableSum = 0;
      let waitingSum = 0;

      data.forEach((entry) => {
        let downtimeDuration = 0;
        downtimeDuration = parseFloat(entry.Minutes);

        if (downtimeDuration > 0) {
          if (entry.Mesin === "Planned Stop") {
            plannedSum += downtimeDuration;
          } else if (
            breakdownMachine.map((item) => item.mesin).includes(entry.Mesin)
          ) {
            unplannedSum += downtimeDuration;
          } else if (entry.Mesin === "Unavailable Time") {
            unavailableSum += downtimeDuration;
          } else if (entry.Mesin === "Process Waiting") {
            waitingSum += downtimeDuration;
          }
        }
      });

      setDurationSums({
        PlannedStoppages: plannedSum,
        UnplannedStoppages: unplannedSum,
        UnavailableTime: unavailableSum,
        ProcessWaiting: waitingSum,
      });
    };

    if (stoppageData) {
      calculateSums(stoppageData);
    }
  }, [value, stoppageData, breakdownMachine]);

  // Get Shift from localStorage
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

  // Parse date to ISO without changing the value
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

  const formatFullDateTime = (dateString) => {
    if (!(dateString instanceof Date)) {
      dateString = new Date(dateString);
    }

    return `${dateString.getUTCDate().toString().padStart(2, "0")}-${(
      dateString.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dateString.getFullYear().toString()} 
    ${dateString.getUTCHours().toString().padStart(2, "0")}:${dateString
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate Available Time
  useEffect(() => {
    if (initialData.length === 0) return;

    const currentTime = new Date();

    const activeDurations = initialData.map((entry) => {
      const shift = localStorage.getItem("shift");
      const date = localStorage.getItem("date");
      const shiftTimes = getShift(shift, date);
      const start = new Date(entry.actual_start);
      start.setHours(start.getHours() - 7);

      let end;
      if (entry.actual_end) {
        end = new Date(entry.actual_end);
        end.setHours(end.getHours() - 7);
      } else {
        if (start < shiftTimes.startTime) {
          end = new Date();
        } else {
          end = shiftTimes.endTime;
        }
      }

      let startAvailable, endAvailable;
      if (
        start.getDate() < end.getDate() &&
        start.getDate() < end.getDate() - 1
      ) {
        if (start.getHours() < 22) {
          return 0;
        }
      }

      const calculateEndTime = (start, duration) => {
        const startTime = new Date(start);
        const durationMinutes = parseInt(duration, 10);

        const endDate = new Date(startTime.getTime() + durationMinutes * 60000);
        return endDate;
      };

      startAvailable =
        start < shiftTimes.startTime
          ? shiftTimes.startTime
          : shiftTimes.startTime;
      if (end < shiftTimes.endTime) {
        const hasDowntimeAfterLastPO = stoppageData.some((downtime) => {
          const downtimeStart = new Date(downtime.Date);
          downtimeStart.setHours(downtimeStart.getHours() - 7);
          const downtimeEnd = new Date(
            calculateEndTime(downtime.Date, downtime.Minutes)
          );
          downtimeEnd.setHours(downtimeEnd.getHours() - 7);
          return (
            (downtimeStart >= end && downtimeStart < shiftTimes.endTime) ||
            (downtimeEnd > end && downtimeEnd <= shiftTimes.endTime)
          );
        });

        if (hasDowntimeAfterLastPO) {
          endAvailable = shiftTimes.endTime;
        } else {
          endAvailable = end;
        }
      } else {
        endAvailable = shiftTimes.endTime;
      }
      return Math.round((endAvailable - startAvailable) / (1000 * 60)); // Duration in minutes
    });

    // Determine endTime
    initialData?.forEach((entry) => {
      let endTime = entry.actual_end ? new Date(entry.actual_end) : currentTime;

      // Calculate endTimeString untuk nilai actual_end null atau existing
      let endTimeString = "";
      if (entry.actual_end) {
        endTimeString = `${endTime
          .getUTCHours()
          .toString()
          .padStart(2, "0")}:${endTime
          .getUTCMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else {
        endTimeString = `${endTime.getUTCDate().toString().padStart(2, "0")}-${(
          endTime.getUTCMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${endTime
          .getUTCFullYear()
          .toString()
          .padStart(2, "0")} ${endTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${endTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      }
      setEndTime(endTimeString); // Set endTime in the state
    });

    // Total active time in minutes
    const totalActiveTime = activeDurations.reduce(
      (sum, duration) => sum + duration,
      0
    );

    setTimeDifference(totalActiveTime);

    const year = currentTime.getFullYear().toString();
    setCalendarMinutes(getMinutesInYear(year));
  }, [initialData, allPO]);

  // Get quantity data for each PO
  useEffect(() => {
    if (allPO) {
      const fetchData = async () => {
        const results = await Promise.all(
          allPO.map(async (entry) => {
            const res = await fetch("/api/getFinishGood", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                line: value,
                date_start: entry.actual_start,
                date_end: entry.actual_end || localTime,
                plant: plant,
              }),
            });
            if (!res.ok) {
              throw new Error("Failed to fetch quantity data");
            }

            const quantityData = await res.json();
            if (Array.isArray(quantityData) && quantityData.length > 0) {
              return quantityData.reduce(
                (sum, item) => sum + parseFloat(item.Downtime),
                0
              );
            }
            return 0; // Default to 0 if no data
          })
        );
        setQtyPO(results); // Update qtyPO with an array of downtimes
      };

      fetchData().catch((error) =>
        console.error("Error fetching quantity data: ", error)
      );
    }
  }, [allPO]);

  // Fetch Quality Loss, Speed Loss, and total quantity
  useEffect(() => {
    const fetchQualityLoss = async () => {
      try {
        const shift = localStorage.getItem("shift");
        const date = localStorage.getItem("date");
        const getShiftTimes = getShift(shift, date);

        // Extract shift start and end times
        const startTime = getShiftTimes.startTime;
        const endTime = getShiftTimes.endTime;

        // Helper function to fetch data
        const fetchData = async (url, body) => {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          if (!response.ok) throw new Error(`Failed to fetch data from ${url}`);
          return response.json();
        };

        // Prepare body for all API calls
        const requestBody = {
          line: value,
          date_start: toLocalISO(startTime),
          date_end: toLocalISO(endTime) || localTime,
          plant: plant,
        };

        // Fetch all data in parallel
        const [qualityLossData, speedLossData, quantityData, rejectSampleData] =
          await Promise.all([
            fetchData("/api/getQualLoss", requestBody),
            fetchData("/api/getSpeedLoss", requestBody),
            fetchData("/api/getFinishGood", requestBody),
            fetchData("/api/getRejectSample", requestBody),
          ]);

        // Aggregate results
        const totalQualityLoss = qualityLossData.reduce(
          (sum, item) => sum + parseFloat(item.Downtime || 0),
          0
        );
        const totalSpeedLoss = speedLossData.reduce(
          (sum, item) => sum + parseFloat(item.Downtime || 0),
          0
        );
        const totalQuantity = quantityData.reduce(
          (sum, item) => sum + parseFloat(item.Downtime || 0),
          0
        );
        const totalRejectSample = rejectSampleData.reduce(
          (sum, item) => sum + parseFloat(item.Downtime || 0),
          0
        );

        // Set states
        setQualityLoss(totalQualityLoss * 60);
        setSpeedLoss(totalSpeedLoss * 60);
        setQty(totalQuantity);
        setrejectQty(totalRejectSample);
      } catch (error) {
        console.error(
          "Error fetching downtime data in MainContainer.js:",
          error
        );
      }
    };

    if (allPO) {
      fetchQualityLoss();
    }
  }, [allPO]);

  // Dapatkan menit dalam 1 tahun untuk calendar time
  const getMinutesInYear = (year) => {
    const isLeapYear = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    };

    const daysInYear = isLeapYear(year) ? 366 : 365;
    return daysInYear * 24 * 60; // 24 hours in a day, 60 minutes in an hour
  };

  // Cek array existing atau tidak
  useEffect(() => {
    if (!initialData || !Array.isArray(initialData)) {
      return; // Skip the effect logic if data is not ready
    }

    if (!stoppageData || !Array.isArray(stoppageData)) {
      return; // Skip the effect logic if data is not ready
    }

    // Add the main logic that depends on `initialData` and `stoppageData`
  }, [initialData, stoppageData]);

  // calculations
  const availableTime = calculateAvailableTime(
    timeDifference,
    durationSums.UnavailableTime
  );
  {
    allPO.map((_, index) => {
      let { net, netDisplay } = calculateNet(
        qtyPO[index],
        rejectQty,
        skuSpeeds[productIds[index]] || 1
      );
      console.log("totalnetDisplay", netDisplay);
      // Accumulate totals
      totalnet += net;
      totalnetDisplay += netDisplay;
    });
  }
  const net = totalnet;
  totalnetDisplay = totalnet.toFixed(2);
  console.log("totalnetDisplay", totalnetDisplay);

  const { production, productionDisplay } = calculateProduction(
    net,
    durationSums,
    speedLoss,
    qualityLoss
  );
  const { running, runningDisplay } = calculateRunning(
    net,
    speedLoss,
    qualityLoss
  );
  const { operation, operationDisplay } = calculateOperation(
    production,
    durationSums.ProcessWaiting
  );
  const { nReported, nReportedDisplay } = calculateNReported(
    timeDifference,
    production,
    durationSums.ProcessWaiting,
    durationSums.PlannedStoppages,
    durationSums.UnavailableTime
  );
  const estimated = (
    durationSums.UnplannedStoppages +
    parseFloat(speedLoss) +
    parseFloat(nReported)
  ).toFixed(2);

  const pe = net && production ? ((net / production) * 100).toFixed(2) : "0.00";
  const oee =
    net && availableTime ? ((net / availableTime) * 100).toFixed(2) : "0.00";
  // sent to backend (hours)
  const netDB = (qty - rejectQty) / (skuSpeed || 1);
  const prodDB =
    parseFloat(netDB) +
    durationSums.UnplannedStoppages / 60 +
    parseFloat(speedLoss) +
    parseFloat(qualityLoss / 60);
  const runDB =
    parseFloat(netDB) + parseFloat(speedLoss) + parseFloat(qualityLoss / 60);
  const nRDB =
    (timeDifference / 60 ?? 0) -
    (prodDB ?? 0) -
    durationSums.ProcessWaiting / 60 -
    durationSums.PlannedStoppages / 60 -
    durationSums.UnavailableTime / 60;
  const operationDB = prodDB + durationSums.ProcessWaiting / 60;
  const availableDB = timeDifference
    ? timeDifference / 60 - durationSums.UnavailableTime / 60
    : 0;
  const breakdownDB = durationSums.UnplannedStoppages / 60;
  const processWaitingDB = durationSums.ProcessWaiting / 60;
  const plannedDB = durationSums.PlannedStoppages / 60;
  //percentage calculations
  const { plannedStop, percentBreakdown, percentQualLoss, percentSpeedLoss } =
    calculatePercentages(
      availableTime,
      durationSums,
      production,
      running,
      qualityLoss,
      speedLoss
    );
  const mtbf = calculateMtbf(production, durationSums.UnplannedStoppages);

  // Count unavailable time
  let ut,
    totalGapTime = 0;
  const shift = localStorage.getItem("shift");
  const date = localStorage.getItem("date");
  const shiftData = getShift(shift, date) || {};
  const { startTime: shiftStart = null, endTime: shiftEnd = null } = shiftData;
  const { unavailableTime, unavailableTimeInMinutes } =
    calculateUnavailableTime(
      initialData,
      allPO,
      stoppageData,
      shiftStart,
      shiftEnd,
      durationSums
    );

  ut = unavailableTimeInMinutes / 60;

  // Set latest start untuk kirim data ke backend
  useEffect(() => {
    let calculatedStart = null;
    const shift = localStorage.getItem("shift");
    const date = localStorage.getItem("date");
    const shiftTimes = getShift(shift, date);
    initialData?.forEach((entry) => {
      const start = new Date(entry.actual_start);
      start.setHours(start.getHours() - 7);

      calculatedStart =
        start < shiftTimes.startTime
          ? shiftTimes.startTime
          : shiftTimes.startTime;
    });
    setLatestStart(toLocalISO(calculatedStart));
  }, [initialData]);

  // Insert calculation to back-end
  useEffect(() => {
    if (
      latestStart === null ||
      prodDB === null ||
      runDB === null ||
      netDB === null ||
      nRDB === null ||
      operationDB === null ||
      availableDB === null ||
      breakdownDB === null ||
      processWaitingDB === null ||
      plannedDB === null
    )
      return;
    const sendDataToBackend = async () => {
      try {
        const response = await fetch("/api/insertPerformance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            net: netDB,
            running: runDB,
            production: prodDB,
            operation: operationDB,
            nReported: nRDB,
            available: availableDB,
            breakdown: breakdownDB,
            processwait: processWaitingDB,
            planned: plannedDB,
            ut: ut,
            startTime: latestStart,
            line: value,
            group: group,
            plant: plant,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send data to the server");
        }

        const result = await response.json();
      } catch (error) {
        console.error("Error sending data to backend:", error);
      }
    };

    if (netDB && runDB && prodDB && nRDB) {
      sendDataToBackend();
    }
  }, [latestStart, prodDB, runDB, netDB, nRDB, initialData, value]);

  return (
    <>
      <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
        {/* Content on the rectangle */}
        {/* {showModal && <ProductionForm setShowModal={setShowModal}/>} */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="relative col-span-1 w-full flex flex-col h-full px-10 py-4 overflow-y-auto"
            style={{ maxHeight: "400px" }}
          >
            {allPO.map((entry, index) => (
              <ul key={entry.id}>
                <li className="text-2xl font-bold text-black">
                  SFP ID{" "}
                  {entry.id.toString().length > 12
                    ? `${entry.id.toString().slice(0, -1)}-${entry.id % 10}`
                    : entry.id}
                </li>
                <li className="mt-2 text-black">Status: {entry.status}</li>
                <li className="mt-2 text-black">Material: {entry.sku}</li>
                <li className="mt-2 text-black">
                  Total Planned: {entry.qty} liter
                </li>
                <li
                  className="mt-2 text-black cursor-pointer bg-green-500"
                  onClick={() => setQtyModal(true)}
                >
                  Finish Good: {qtyPO[index] || 0} liter
                </li>
                <li className="mt-2 text-black">
                  Total Produced in Current Shift: {qty} liter
                </li>
                <li className="mt-2 text-black">
                  Start Time: {formatFullDateTime(entry.actual_start)}
                </li>
                <li className="mt-2 text-black">
                  {entry.actual_end
                    ? `End Time: ${formatFullDateTime(entry.actual_end)}`
                    : `Current Time: ${endTime}`}
                </li>
                <p className="mt-2 text-black">
                  Nominal Speed:{" "}
                  {skuSpeeds[entry.product_id]
                    ? `${skuSpeeds[entry.product_id]} liter/hr`
                    : "Loading..."}
                </p>
              </ul>
            ))}
          </div>
          {qtyModal && <Quantity onClose={() => setQtyModal(false)} />}
          <div className="relative col-span-2 w-full flex flex-col h-full px-2 py-4">
            <table className="w-full border-collapse min-w-full table-auto">
              <thead>
                <tr>
                  <th
                    colSpan="3"
                    style={{ border: "1px white", padding: "8px" }}
                    className="text-black bg-gray-300"
                  >
                    Performance Indicator (Minutes)
                  </th>
                  <th
                    colSpan="1"
                    style={{ border: "1px white", padding: "8px" }}
                    className="text-black bg-gray-300"
                  >
                    Minutes
                  </th>
                  <th
                    colSpan="1"
                    style={{ border: "1px white", padding: "8px" }}
                    className="text-black bg-gray-300"
                  >
                    Minutes (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Example rows */}
                <tr>
                  <th className={TdStyle.TdStyleH}>Calendar Time</th>
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                      fontWeight: "normal",
                      textAlign: "left",
                    }}
                  >
                    {(availableTime + unavailableTimeInMinutes).toFixed(2)}
                  </th>
                  <th className={TdStyle.TdStyle5}>Planned Stoppages</th>
                  {/* Ambil data dari planned stoppages */}
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                      fontWeight: "normal",
                      textAlign: "left",
                    }}
                  >
                    {durationSums.PlannedStoppages.toFixed(2)}
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                      fontWeight: "normal",
                      textAlign: "left",
                    }}
                  >
                    {(
                      (durationSums.PlannedStoppages / timeDifference) *
                      100
                    ).toFixed(2) || 0.0}
                  </th>
                </tr>
                <tr>
                  <td className={TdStyle.TdStyle}>Available Time</td>
                  {/* Operational Time = Available Time - Planned Stoppages */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {availableTime}
                  </td>
                  <td className={TdStyle.TdStyle6}>
                    Breakdown/Process Failure/Minor Stop
                  </td>
                  {/* Ambil data from unplanned stoppages */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {durationSums.UnplannedStoppages.toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {(
                      (durationSums.UnplannedStoppages / timeDifference) *
                      100
                    ).toFixed(2) || 0.0}
                  </td>
                </tr>
                {/* Add more rows as needed */}
                <tr>
                  <td className={TdStyle.TdStyle2}>Operational Time</td>
                  {/* Production Time = NPT + Total breakdown + Total Speed Loss + Quality Losses */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {operationDisplay}
                  </td>
                  <td
                    className={TdStyle.TdStyle7}
                    onClick={() => setSpeedLossModal(true)}
                  >
                    Speed Loss
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {parseFloat(speedLoss).toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    0.0
                  </td>
                </tr>
                {speedLossModal && (
                  <Speed onClose={() => setSpeedLossModal(false)} />
                )}
                <tr>
                  <td className={TdStyle.TdStyle3}>Production Time</td>
                  {/* Running Time = Production Time - Breakdown/Process Failure Duration */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {productionDisplay}
                  </td>
                  <td className={TdStyle.TdStyle8}>Process Waiting</td>
                  {/* Buat tabel baru? */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {durationSums.ProcessWaiting.toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    0.0
                  </td>
                </tr>
                <tr>
                  <td className={TdStyle.TdStyleGr}>Running Time</td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {runningDisplay}
                  </td>
                  <td className={TdStyle.TdStyle9}>Not Reported</td>
                  {/* Not Reported = 60 - (Production Time + Total Process Waiting + Planned Stop + Unavailable Time) */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {nReportedDisplay}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    0.0
                  </td>
                </tr>
                <tr>
                  <td className={TdStyle.TdStyleG}>Unavailable Time</td>
                  {/* Unavailable time isi dari form atau retrieve dari db */}
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {unavailableTimeInMinutes.toFixed(2)}
                  </td>
                  <td
                    className={TdStyle.TdStyle10}
                    onClick={() => setQualityLossModal(true)}
                  >
                    Quality Loss
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {parseFloat(qualityLoss).toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {((qualityLoss / timeDifference) * 100).toFixed(2) || 0.0}
                  </td>
                </tr>
                {qualityLossModal && (
                  <QualityLossProcessing
                    onClose={() => setQualityLossModal(false)}
                  />
                )}
                <tr>
                  <td className={TdStyle.TdStyle4}>NPT</td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {totalnetDisplay}
                  </td>
                  <td className={TdStyle.TdStyle11}>
                    Estimated Unplanned Stoppage
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {estimated}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "8px",
                      color: "black",
                    }}
                  >
                    {((estimated / timeDifference) * 100).toFixed(2) || 0.0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <br></br>
      <h1 className="text-black text-2xl text-center font-bold">
        Current Shift KPI
      </h1>
      <br></br>
      <div className="grid grid-cols-5 gap-4">
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {plannedStop || 0.0}%
          </h1>
          <p className="text-gray-500 text-center">Planned stops</p>
        </div>
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {percentBreakdown || percentBreakdown.toFixed(2)}%
          </h1>
          <p className="text-gray-500 text-center">
            Breakdown/Process Failure/Minor Stop
          </p>
        </div>
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {percentQualLoss || percentQualLoss.toFixed(2)}%
          </h1>
          <p className="text-gray-500 text-center">Quality Loss</p>
        </div>
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {mtbf || mtbf.toFixed(2)}
          </h1>
          <p className="text-gray-500 text-center">
            Mean Time Between Failures (minutes)
          </p>
        </div>
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {percentSpeedLoss || percentSpeedLoss.toFixed(2)}%
          </h1>
          <p className="text-gray-500 text-center">Speed Loss</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {((estimated / timeDifference) * 100).toFixed(2) || 0.0}%
          </h1>
          <p className="text-gray-500 text-center">%EUPS</p>
        </div>
        <div className="mb-2">
          <h1 className="text-black text-4xl text-center font-bold">
            {oee || 0.0}%
          </h1>
          <p className="text-gray-500 text-center">%OE</p>
        </div>
      </div>
    </>
  );
};

export default RectangleContainerProcessing;
