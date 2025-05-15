import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RectangleChart = ({ initialData, localTime, allPO }) => {
  const [downtimeData, setDowntimeData] = useState([]);
  const searchParams = useSearchParams();
  const value = searchParams.get("value");

  let downtimeEndTime = "";

  const currentShift = localStorage.getItem("shift");
  const currentDate = localStorage.getItem("date");

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

  useEffect(() => {
    const fetchDownTimeData = async () => {
      try {
        const shiftTimes = getShift(currentShift, currentDate);
        let start, end;
        initialData.forEach(async (entry) => {
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
            "Sent data for chart: ",
            toLocalISO(start),
            toLocalISO(end) || localTime,
            value
          );
          const response = await fetch("/api/getDowntimePO", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date_start: toLocalISO(start),
              date_end: toLocalISO(end) || localTime,
              line: value,
            }),
          });
          const data = await response.json();
          console.log("Retrieved downtime in Shift: ", data);
          setDowntimeData(data);
        });
      } catch (error) {
        console.error("Error fetching downtime data in MainChart.js:", error);
      }
    };

    if (initialData) {
      fetchDownTimeData();
    }
  }, [initialData]);

  const formatDateTime = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
      return "N/A";
    }
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);
    return `${date.getUTCDate().toString().padStart(2, "0")}/${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getUTCFullYear()} ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const calculateEndTime = (start, duration) => {
    const startTime = new Date(start);
    const durationMinutes = parseInt(duration, 10);

    const endDate = new Date(startTime.getTime() + durationMinutes * 60000);

    return endDate.toISOString();
  };

  const groupedOrdersMap = new Map();

  initialData.forEach((order) => {
    const { id, line, actual_start, actual_end } = order;

    const orderEndTime = actual_end ? actual_end : localTime;

    const startTime = new Date(actual_start);
    const localHour = startTime.getUTCHours();
    let shiftStart = new Date(startTime);
    let shiftEnd = new Date(startTime);
    const getShiftTimes = getShift(currentShift, currentDate) || {};

    const shiftPOs = allPO.filter((po) => {
      const poStart = new Date(po.actual_start);
      poStart.setHours(poStart.getHours() - 7);
      const poEnd = po.actual_end ? new Date(po.actual_end) : new Date();
      if (po.actual_end) {
        poEnd.setHours(poEnd.getHours() - 7);
      }
      return (
        (poStart >= getShiftTimes.startTime &&
          poStart < getShiftTimes.endTime) || // PO starts within shift
        (poEnd > getShiftTimes.startTime && poEnd <= getShiftTimes.endTime) || // PO ends within shift
        (poStart < getShiftTimes.startTime && poEnd > getShiftTimes.endTime) // PO spans the shift entirely
      );
    });

    // Sort POs by actual_start for consistent ordering
    const sortedShiftPOs = shiftPOs.sort(
      (a, b) => new Date(a.actual_start) - new Date(b.actual_start)
    );

    // Initialize unavailable time data
    const unavailableTimes = [];
    let previousPOEnd = getShiftTimes.startTime;

    sortedShiftPOs.forEach((po) => {
      const poStart = new Date(po.actual_start);
      poStart.setHours(poStart.getHours() - 7);
      const uniqueId = `${po.id}-${po.actual_start}-${po.actual_end}`;

      const hasDowntimeInGap = downtimeData.some((downtime) => {
        const downtimeStart = new Date(downtime.Date);
        downtimeStart.setHours(downtimeStart.getHours() - 7);
        const downtimeEnd = new Date(
          calculateEndTime(downtime.Date, downtime.Minutes)
        );
        downtimeEnd.setHours(downtimeEnd.getHours() - 7);
        return (
          (downtimeStart >= previousPOEnd && downtimeStart < poStart) ||
          (downtimeEnd > previousPOEnd && downtimeEnd <= poStart)
        );
      });

      if (!hasDowntimeInGap && previousPOEnd < poStart) {
        // Gap between previous PO and current PO
        const gapDuration = (poStart - previousPOEnd) / 60000; // Convert to minutes
        unavailableTimes.push({
          id: `unavailable-gap-${uniqueId}`,
          Line: line,
          Date: toLocalISO(previousPOEnd),
          Minutes: gapDuration,
          Downtime_Category: "Unavailable Time",
        });
      }
      // Update previousPOEnd to the end of the current PO
      previousPOEnd = po.actual_end ? new Date(po.actual_end) : new Date();
      if (po.actual_end) {
        previousPOEnd.setHours(previousPOEnd.getHours() - 7);
      }
    });

    const hasDowntimeAfterLastPO = downtimeData.some((downtime) => {
      const downtimeStart = new Date(downtime.Date);
      downtimeStart.setHours(downtimeStart.getHours() - 7);
      const downtimeEnd = new Date(
        calculateEndTime(downtime.Date, downtime.Minutes)
      );
      downtimeEnd.setHours(downtimeEnd.getHours() - 7);
      return (
        (downtimeStart >= previousPOEnd &&
          downtimeStart < getShiftTimes.endTime) ||
        (downtimeEnd > previousPOEnd && downtimeEnd <= getShiftTimes.endTime)
      );
    });

    // Check for gap between last PO and shift end
    if (!hasDowntimeAfterLastPO && previousPOEnd < getShiftTimes.endTime) {
      const gapDuration = (getShiftTimes.endTime - previousPOEnd) / 60000; // Convert to minutes
      unavailableTimes.push({
        id: `unavailable-end-${id}`,
        Line: line,
        Date: toLocalISO(previousPOEnd),
        Minutes: gapDuration,
        Downtime_Category: "Unavailable Time",
      });
    }

    const filteredDowntimes = (
      Array.isArray(downtimeData) ? downtimeData : []
    ).filter((downtime) => {
      downtimeEndTime = calculateEndTime(downtime.Date, downtime.Minutes);

      return (
        downtime.Line.toUpperCase() === line.toUpperCase() &&
        downtime.Date <= toLocalISO(getShiftTimes.endTime) &&
        downtimeEndTime >= toLocalISO(getShiftTimes.startTime) // Overlaps with order's range
      );
    });

    const downtimesWithUnavailabilities = [
      ...filteredDowntimes,
      ...unavailableTimes,
    ];

    // Sort downtimes by start time for consistent rendering
    const sortedDowntimes = downtimesWithUnavailabilities.sort(
      (a, b) => new Date(a.Date) - new Date(b.Date)
    );

    if (groupedOrdersMap.has(id)) {
      const existingOrder = groupedOrdersMap.get(id);
      existingOrder.downtimes.push(...sortedDowntimes);
      existingOrder.downtimes = existingOrder.downtimes.sort(
        (a, b) => new Date(a.Date) - new Date(b.Date)
      );
      existingOrder.orderEndTime = new Date(
        Math.max(new Date(existingOrder.orderEndTime), new Date(orderEndTime))
      );
    } else {
      groupedOrdersMap.set(id, {
        ...order,
        downtimes: sortedDowntimes,
        orderEndTime,
      });
    }
  });

  const mappedOrders = Array.from(groupedOrdersMap.values());

  const calculateStartPercentage = (startTime, startDate, endDate) => {
    if (!startTime || !startDate || !endDate) return 0;
    const clippedStartTime = Math.max(new Date(startTime), new Date(startDate)); // Clip start time to order's start
    const totalDuration = new Date(endDate) - new Date(startDate);
    const offset = clippedStartTime - new Date(startDate);
    return (offset / totalDuration) * 100;
  };

  const calculateDurationPercentage = (
    startTime,
    endTime,
    startDate,
    endDate
  ) => {
    if (!startTime || !endTime || !startDate || !endDate) return 0;
    const clippedStartTime = Math.max(new Date(startTime), new Date(startDate)); // Clip start time to order's start
    const clippedEndTime = Math.min(new Date(endTime), new Date(endDate)); // Clip end time to order's end
    const totalDuration = new Date(endDate) - new Date(startDate);
    const duration = clippedEndTime - clippedStartTime;
    return (duration / totalDuration) * 100;
  };

  const parseISOToLocal = (isoString) => {
    if (!isoString) {
      throw new Error("Invalid ISO string"); // Add a safety check
    }
    const [date, time] = isoString.split("T");
    if (!date || !time) {
      throw new Error(`Unexpected format for ISO string: ${isoString}`);
    }
    const [year, month, day] = date.split("-");
    const [hours, minutes, seconds] = time.split(":");
    if (!year || !month || !day || !hours || !minutes || !seconds) {
      throw new Error(
        `Invalid date or time components in ISO string: ${isoString}`
      );
    }

    return new Date(
      parseInt(year), // Year
      parseInt(month) - 1, // Month (0-based in JS Date)
      parseInt(day), // Day
      parseInt(hours), // Hours
      parseInt(minutes), // Minutes
      parseFloat(seconds) // Seconds
    );
  };

  const generateTimestamps = (start, end, intervalMinutes) => {
    const startTime = new Date(parseISOToLocal(start));
    const endTime = new Date(parseISOToLocal(end));
    const timestamps = [];

    while (startTime <= endTime) {
      timestamps.push(
        `${startTime.getHours().toString().padStart(2, "0")}:${startTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
      startTime.setMinutes(startTime.getMinutes() + intervalMinutes); // Advance by interval
    }

    return timestamps;
  };

  const renderTimeline = (startDate, endDate) => {
    const timestamps = generateTimestamps(startDate, endDate, 30);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "10px 0",
        }}
      >
        {timestamps.map((time, index) => (
          <span key={index} style={{ fontSize: "12px", color: "#333" }}>
            {time}
          </span>
        ))}
      </div>
    );
  };

  const renderLegend = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        marginBottom: "10px",
        width: "100%",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center" }}
        aria-label="Runtime"
      >
        <div
          style={{
            width: "20px",
            height: "10px",
            backgroundColor: "#4CAF50",
            marginRight: "5px",
          }}
        ></div>
        <span className="text-black">Runtime</span>
      </div>
      <div
        style={{ display: "flex", alignItems: "center" }}
        aria-label="Planned Stoppages"
      >
        <div
          style={{
            width: "20px",
            height: "10px",
            backgroundColor: "#FFD700",
            marginRight: "5px",
          }}
        ></div>
        <span className="text-black">Planned Stoppages</span>
      </div>
      <div
        style={{ display: "flex", alignItems: "center" }}
        aria-label="Breakdown"
      >
        <div
          style={{
            width: "20px",
            height: "10px",
            backgroundColor: "#FF6347",
            marginRight: "5px",
          }}
        ></div>
        <span className="text-black">Breakdown/Process Failure/Minor Stop</span>
      </div>
      <div
        style={{ display: "flex", alignItems: "center" }}
        aria-label="Unavailable Time"
      >
        <div
          style={{
            width: "20px",
            height: "10px",
            backgroundColor: "#CDA2AB",
            marginRight: "5px",
          }}
        ></div>
        <span className="text-black">Unavailable Time</span>
      </div>
      <div
        style={{ display: "flex", alignItems: "center" }}
        aria-label="Process Waiting"
      >
        <div
          style={{
            width: "20px",
            height: "10px",
            backgroundColor: "#E92CF9",
            marginRight: "5px",
          }}
        ></div>
        <span className="text-black">Process Waiting</span>
      </div>
    </div>
  );

  const renderOrders = () => {
    if (!mappedOrders || !Array.isArray(mappedOrders)) {
      return <p>Loading orders...</p>; // Handle cases where mappedOrders isn't ready
    }

    const sortedOrders = [...mappedOrders].sort(
      (a, b) => new Date(a.actual_start) - new Date(b.actual_start)
    );

    const shiftStartTimes = {
      1: "06:00:00",
      2: "14:00:00",
      3: "22:00:00",
    };

    const shiftEndTimes = {
      1: "14:00:00",
      2: "22:00:00",
      3: "06:00:00",
    };

    const getShiftForDate = (date) => {
      const localHours = new Date(date).getHours();
      if (localHours >= 6 && localHours < 14) return 1;
      if (localHours >= 14 && localHours < 22) return 2;
      return 3;
    };

    const calculateShiftBoundaries = (shift, referenceDate) => {
      const startDate = new Date(referenceDate);
      const endDate = new Date(referenceDate);

      // Set the shift start and end times
      const [startHours, startMinutes, startSeconds] =
        shiftStartTimes[shift].split(":");
      const [endHours, endMinutes, endSeconds] =
        shiftEndTimes[shift].split(":");

      startDate.setHours(startHours, startMinutes, startSeconds, 0);
      endDate.setHours(endHours, endMinutes, endSeconds, 0);

      // Handle cross-day end time (e.g., shift 3 ends at 6 AM next day)
      if (shift === 3) {
        const localHour = new Date(referenceDate).getUTCHours();
        if (localHour < 6) {
          startDate.setDate(startDate.getDate() - 1); // Move start time to previous day
        } else {
          endDate.setDate(endDate.getDate() + 1); // Move end time to next day
        }
      }

      return { start: startDate, end: endDate };
    };

    return sortedOrders.map((order, index) => {
      const { id, line, actual_start, actual_end, downtimes } = order;

      const shiftTimes = getShift(currentShift, currentDate) || {};
      const renderedShift = getShiftForDate(shiftTimes.startTime);
      const { start: shiftStart, end: shiftEnd } = calculateShiftBoundaries(
        renderedShift,
        shiftTimes.startTime
      );

      const endTime = actual_end ? actual_end : localTime;
      let orderBarColor = "#4CAF50";

      if (!downtimes || downtimes.length === 0) {
        return (
          <div
            key={id}
            style={{
              position: "relative",
              marginBottom: "20px",
              marginLeft: "10px",
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                height: "20px",
                width: "100%",
                backgroundColor: orderBarColor,
                borderRadius: "4px",
              }}
            />
            {renderTimeline(toLocalISO(shiftStart), toLocalISO(shiftEnd))}
          </div>
        );
      }

      return (
        <div
          key={id}
          style={{
            position: "relative",
            marginBottom: "20px",
            marginLeft: "10px",
            width: "100%",
          }}
        >
          {/* Background for the order container (not the downtime bars) */}
          <div
            style={{
              position: "relative",
              height: "20px",
              width: "100%",
              backgroundColor: "#4CAF50",
              borderRadius: "2px",
            }}
          >
            {downtimes.map((downtime) => {
              const startPercentage = calculateStartPercentage(
                downtime.Date,
                toLocalISO(shiftStart),
                toLocalISO(shiftEnd)
              );
              const durationPercentage = calculateDurationPercentage(
                downtime.Date,
                calculateEndTime(downtime.Date, downtime.Minutes),
                toLocalISO(shiftStart),
                toLocalISO(shiftEnd)
              );

              if (durationPercentage <= 0) return null;

              let barColor = "#4CAF50";
              if (downtime.Downtime_Category === "Planned Stop") {
                barColor = "#FFD700";
              } else if (
                ["Breakdown", "Minor Stop", "Process Failure"].includes(
                  downtime.Downtime_Category
                )
              ) {
                barColor = "#FF6347";
              } else if (downtime.Downtime_Category === "Unavailable Time") {
                barColor = "#CDA2AB";
              } else if (downtime.Downtime_Category === "Process Waiting") {
                barColor = "#E92CF9";
              }

              return (
                <div
                  key={`${downtime.id}-${downtime.Date}`} // Unique key for each downtime
                  style={{
                    position: "absolute",
                    left: `${startPercentage}%`,
                    width: `${durationPercentage}%`,
                    backgroundColor: barColor, // This sets the actual bar color
                    height: "100%",
                    borderRadius: "2px",
                  }}
                  title={`Category: ${
                    downtime.Downtime_Category
                  }\nStart: ${formatDateTime(
                    downtime.Date
                  )}\nEnd: ${formatDateTime(
                    calculateEndTime(downtime.Date, downtime.Minutes)
                  )}\nDuration: ${downtime.Minutes} minutes`} // Tooltip for details
                />
              );
            })}

            {endTime > localTime && (
              <div
                style={{
                  position: "absolute",
                  left: `${calculateStartPercentage(
                    endTime,
                    actual_start,
                    actual_end || localTime
                  )}%`,
                  width: `${
                    100 -
                    calculateStartPercentage(
                      endTime,
                      actual_start,
                      actual_end || localTime
                    )
                  }%`,
                  backgroundColor: "#f0f0f0", // Grey for remaining uncompleted portion
                  height: "100%",
                  borderRadius: "2px",
                }}
              />
            )}
          </div>
          {renderTimeline(toLocalISO(shiftStart), toLocalISO(shiftEnd))}
        </div>
      );
    });
  };

  if (!initialData || !Array.isArray(initialData)) {
    return <p>Loading...</p>; // Or handle the loading state appropriately
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-black px-5 py-4">Line Summary</h1>
      {/* Chart Section */}
      {renderOrders()}

      {/* Legend Section */}
      {renderLegend()}
    </>
  );
};

export default RectangleChart;
