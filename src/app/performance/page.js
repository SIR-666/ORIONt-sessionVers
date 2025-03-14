"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import MainLayout from "../mainLayout";

const ReportPerformance = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [filterValue, setFilterValue] = useState("");
  const [filterField, setFilterField] = useState("All"); // New state for the filter field

  const [loading, setLoading] = useState(false);
  const plant = localStorage.getItem("plant");

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

  const handleFilterFieldChange = (event) => {
    setFilterField(event.target.value);
    setFilterValue("");
    setFilteredData(tableData);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/getAllPerformance?plant=${plant}`);
      const newData = await response.json();
      console.log("Fetched Data:", newData);
      setTableData(newData); // Update the data with the current page's data
      setFilteredData(newData);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setTableData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterField && filterValue) {
      if (filterField === "All") {
        setFilteredData(
          tableData.filter((row) =>
            Object.values(row).some(
              (value) =>
                value &&
                value
                  .toString()
                  .toLowerCase()
                  .includes(filterValue.toLowerCase())
            )
          )
        );
      } else {
        setFilteredData(
          tableData.filter((row) => {
            const value = row[filterField]?.toString()?.toLowerCase();
            return value && value.includes(filterValue.toLowerCase());
          })
        );
      }
    } else {
      setFilteredData(tableData);
    }
  }, [filterField, filterValue, tableData]);

  const handleLine = (id) => {
    const lineInitial = id.charAt(0).toUpperCase();

    return `Line ${lineInitial}`;
  };

  const handleGroup = (group) => {
    switch (group) {
      case "B":
        return "BROMO";
      case "S":
        return "SEMERU";
      case "K":
        return "KRAKATAU";
      default:
        return "";
    }
  };

  const handleShift = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
      return "N/A";
    }
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);
    const hour = date.getUTCHours();

    if (hour >= 6 && hour < 14) {
      return "I";
    } else if (hour >= 14 && hour < 22) {
      return "II";
    } else {
      return "III";
    }
  };

  const handleExport = () => {
    const formattedData = filteredData.map((row) => {
      const {
        ID,
        Tanggal,
        ProductionTime,
        OperationTime,
        NPT,
        RunningTime,
        AvailableTime,
        Breakdown,
        Planned,
        ProcessWaiting,
        QualityLoss,
        SpeedLoss,
        DowntimeGroup,
        UnavailableTime,
      } = row;

      const formatWithComma = (num) => {
        if (num === null || num === undefined) return 0; // Default to 0 for null/undefined
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return 0; // Ensure it's a valid number

        // Force two decimal places for display
        const numericValue = Number(parsed.toFixed(2));
        return {
          display: parsed.toFixed(2).replace(".", ","), // Replace period with comma
          numeric: numericValue, // Keep as a number for Excel
        };
      };

      const Shift = handleShift(Tanggal);
      const Line = handleLine(ID);

      return {
        ID: ID,
        Date: formatDateTime(Tanggal),
        Shift:
          Shift === "I"
            ? "I"
            : Shift === "II"
            ? "II"
            : Shift === "III"
            ? "III"
            : 0,
        Group: DowntimeGroup,
        Line: Line.replace("Line ", ""),
        AvailableTime: formatWithComma(AvailableTime),
        UnavailableTime: formatWithComma(UnavailableTime),
        ProductionTime: formatWithComma(ProductionTime),
        OperationTime: formatWithComma(OperationTime),
        RunningTime: formatWithComma(RunningTime),
        NPT: formatWithComma(NPT),
        Planned: formatWithComma(Planned),
        Breakdown: formatWithComma(Breakdown),
        ProcessWaiting: formatWithComma(ProcessWaiting),
        QualityLoss: formatWithComma(QualityLoss),
        SpeedLoss: formatWithComma(SpeedLoss),
      };
    });

    const excelData = formattedData.map((row) => ({
      ...row,
      ProductionTime: row.ProductionTime.numeric,
      OperationTime: row.OperationTime.numeric,
      NPT: row.NPT.numeric,
      RunningTime: row.RunningTime.numeric,
      Planned: row.Planned.numeric,
      Breakdown: row.Breakdown.numeric,
      ProcessWaiting: row.ProcessWaiting.numeric,
      QualityLoss: row.QualityLoss.numeric,
      SpeedLoss: row.SpeedLoss.numeric,
      UnavailableTime: row.UnavailableTime.numeric,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    XLSX.writeFile(workbook, "performance_export.xlsx");
  };

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white"></main>
        <h1 className="text-black text-2xl text-center font-bold">
          Performance Report
        </h1>
        <br></br>
        <div
          style={{ display: "flex", alignItems: "center", margin: "10px 0" }}
        >
          <select
            id="line"
            className="text-black rounded-lg bg-gray-100 focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={filterField}
            onChange={handleFilterFieldChange}
          >
            <option value="all">All</option>
            {Object.keys(tableData[0] || {})
              .filter((key) => key !== "Picture")
              .map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
          </select>
          <div className="relative flex items-center h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden ml-10">
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
              placeholder="Search something..."
            />
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 border border-blue-800 rounded ml-10"
            onClick={handleExport}
          >
            Export to Excel
          </button>
        </div>
        <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
          <div
            className="relative w-full overflow-y-auto flex flex-col h-full px-5 py-4"
            style={{ maxHeight: "350px", overflowY: "auto" }}
          >
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-6">
                    ID
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Date
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Resources
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Shift
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Group
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Line
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Available Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Unavailable Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Production Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Operational Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Running Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Net Production Time
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Planned Stop
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Breakdown/Minor Stop/Process Failure
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Process Waiting
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Quality Loss
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Speed Loss
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10">Loading...</td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr className="bg-white border-b" key={row.ID}>
                      <td className="py-4 px-6">{row.ID}</td>
                      <td className="py-4 px-6">
                        {formatDateTime(row.Tanggal)}
                      </td>
                      <td className="py-4 px-6">Milk Filling Packing</td>
                      <td className="py-4 px-6">{handleShift(row.Tanggal)}</td>
                      <td className="py-4 px-6">
                        {handleGroup(row.DowntimeGroup)}
                      </td>
                      <td className="py-4 px-6">{handleLine(row.ID)}</td>
                      <td className="py-4 px-6">
                        {row.UnavailableTime
                          ? parseFloat(row.AvailableTime).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.UnavailableTime
                          ? parseFloat(row.UnavailableTime).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.ProductionTime
                          ? parseFloat(row.ProductionTime).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.OperationTime
                          ? parseFloat(row.OperationTime).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.RunningTime
                          ? parseFloat(row.RunningTime).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.NPT ? parseFloat(row.NPT).toFixed(3) : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.Planned
                          ? parseFloat(row.Planned).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.Breakdown
                          ? parseFloat(row.Breakdown).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.ProcessWaiting
                          ? parseFloat(row.ProcessWaiting).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.QualityLoss
                          ? parseFloat(row.QualityLoss).toFixed(3)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {row.SpeedLoss
                          ? parseFloat(row.SpeedLoss).toFixed(3)
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default ReportPerformance;
