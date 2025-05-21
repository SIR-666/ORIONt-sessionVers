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
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState(null);

  const displayedColumns = [
    { key: "Tanggal2", label: "Tanggal" },
    { key: "FirstShift", label: "Shift" },
    { key: "GroupShift", label: "Group" },
    { key: "LINE", label: "Line" },
    { key: "AvailableTime", label: "Available" },
    { key: "ProductionTime", label: "Production" },
    { key: "RT", label: "Running" },
    { key: "OT", label: "Operational" },
    { key: "NPT", label: "Net Production" },
    { key: "LossSpeed", label: "Loss Speed" },
    { key: "QualityLosses", label: "Quality Loss" },
    { key: "TotalDowntimeInt", label: "Downtime Int" },
    { key: "TotalDowntimeExt", label: "Downtime Eks" },
    { key: "PE", label: "PE" },
    { key: "OE", label: "OE" },
  ];

  const columnLabels = {
    Tanggal2: "Tanggal",
    FirstShift: "Shift",
    GroupShift: "Group",
    LINE: "Line",
    AvailableTime: "Available",
    ProductionTime: "Production",
    RT: "Running",
    OT: "Operational",
    NPT: "Net Production",
    LossSpeed: "Loss Speed",
    QualityLosses: "Quality Loss",
    TotalDowntimeInt: "Downtime Int",
    TotalDowntimeExt: "Downtime Eks",
    PE: "PE",
    OE: "OE",
  };

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
    if (!plant || !line) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://10.24.0.81:3001/getAllPerformance?plant=${plant}&line=${line}`
      );
      const newData = await response.json();
      console.log("data :", newData);
      const normalizedData = newData.map((item) => ({
        ...item,
        Shift: item.FirstShift,
        Tanggal: item.Tanggal2,
      }));
      setTableData(normalizedData);
      setFilteredData(normalizedData);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setTableData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // const storedPlant = sessionStorage.getItem("plant");
    const storedLine = sessionStorage.getItem("line");
    // setPlant(storedPlant);
    setLine(storedLine);
  }, []);

  useEffect(() => {
    if (plant && line) {
      fetchData();
    }
  }, [plant, line]);

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
    const excelData = filteredData.map((row) => ({
      Tanggal: row.Tanggal2 || "",
      Shift: row.FirstShift?.replace("Shift ", "") || "",
      Group: row.GroupShift || "",
      Line: row.LINE || "",
      Available: parseFloat(row.AvailableTime || 0).toFixed(2),
      Production: parseFloat(row.ProductionTime || 0).toFixed(2),
      Running: parseFloat(row.RT || 0).toFixed(2),
      Operational: parseFloat(row.OT || 0).toFixed(2),
      NetProduction: parseFloat(row.NPT || 0).toFixed(2),
      LossSpeed: parseFloat(row.LossSpeed || 0).toFixed(2),
      QualityLoss: parseFloat(row.QualityLosses || 0).toFixed(2),
      Waiting: parseFloat(row.TotalDowntimeExt || 0).toFixed(2),
      Breakdown: parseFloat(row.TotalDowntimeInt || 0).toFixed(2),
      PE: parseFloat(row.PE || 0).toFixed(2),
      OE: parseFloat(row.OE || 0).toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");

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
            className="text-black rounded-lg bg-gray-100 focus:ring-blue-500 focus:border-blue-500 block p-2.5 mr-4"
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
          >
            <option value="">Pilih Plant</option>
            <option value="Milk Processing">Milk Processing</option>
            <option value="Milk Filling Packing">Milk Filling Packing</option>
            <option value="Cheese">Cheese</option>
            <option value="Yogurt">Yogurt</option>
            <option value="Pasteurize Yogurt">Pasteurize Yogurt</option>
          </select>

          <select
            id="line"
            className="text-black rounded-lg bg-gray-100 focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={filterField}
            onChange={handleFilterFieldChange}
          >
            <option value="All">All</option>
            {displayedColumns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
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
            className="relative w-full overflow-y-auto flex flex-col h-full px-5"
            style={{ maxHeight: "350px", overflowY: "auto" }}
          >
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="py-3 text-xs text-gray-700 uppercase bg-blue-300 sticky top-0 z-20">
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Group</th>
                  <th>Line</th>
                  <th>AT</th>
                  <th>PT</th>
                  <th>RT</th>
                  <th>OT</th>
                  <th>NPT</th>
                  <th>Loss Speed</th>
                  <th>Quality Loss</th>
                  <th>Waiting</th>
                  <th>Breakdown</th>
                  <th>EUPS</th>
                  <th>OEE</th>
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
                      <td>{row.Tanggal2}</td>
                      <td>{row.FirstShift?.replace("Shift ", "")}</td>
                      <td>{row.GroupShift}</td>
                      <td>{row.LINE}</td>
                      <td>
                        {row.AvailableTime
                          ? parseFloat(row.AvailableTime).toFixed(2)
                          : "0"}
                      </td>
                      <td>
                        {row.ProductionTime
                          ? parseFloat(row.ProductionTime).toFixed(2)
                          : "0"}
                      </td>
                      <td>{row.RT ? parseFloat(row.RT).toFixed(2) : "0"}</td>
                      <td>{row.OT ? parseFloat(row.OT).toFixed(2) : "0"}</td>
                      <td>{row.NPT ? parseFloat(row.NPT).toFixed(2) : "0"}</td>
                      <td>
                        {row.LossSpeed
                          ? parseFloat(row.LossSpeed).toFixed(2)
                          : "0"}
                      </td>
                      <td>
                        {row.QualityLosses
                          ? parseFloat(row.QualityLosses).toFixed(2)
                          : "0"}
                      </td>
                      <td>
                        {row.TotalDowntimeExt
                          ? parseFloat(row.TotalDowntimeExt).toFixed(2)
                          : "0"}
                      </td>
                      <td>
                        {row.TotalDowntimeInt
                          ? parseFloat(row.TotalDowntimeInt).toFixed(2)
                          : "0"}
                      </td>
                      <td>
                        {row.AvailableTime &&
                        parseFloat(row.AvailableTime) !== 0
                          ? (
                              ((parseFloat(row.LossSpeed || 0) +
                                parseFloat(row.QualityLosses || 0) +
                                parseFloat(row.TotalDowntimeInt || 0) +
                                parseFloat(row.TotalDowntimeExt || 0)) /
                                parseFloat(row.AvailableTime)) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                      </td>

                      <td>{row.OE ? parseFloat(row.OE).toFixed(2) : "0"}</td>
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
