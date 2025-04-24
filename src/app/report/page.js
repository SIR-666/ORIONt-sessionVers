"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import MainLayout from "../mainLayout";

const ReportTable = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [filterValue, setFilterValue] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(false);

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

  const formatDateOnly = (dateString) => {
    if (!dateString || typeof dateString !== "string") {
      return "N/A";
    }
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);

    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/getAllDowntime");
      const newData = await response.json();
      console.log("Fetched Data:", newData);
      setTableData(newData); // Update the data with the current page's data
      setFilteredData(newData);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    let data = [...tableData];

    if (filterDate) {
      data = data.filter((row) => {
        const rowDate = new Date(row.Date);
        const formatted = rowDate.toISOString().split("T")[0];
        return formatted === filterDate;
      });
    }

    if (selectedPlant) {
      data = data.filter((row) => row.Unit === selectedPlant);
    }

    if (selectedShift) {
      data = data.filter((row) => row.Shift === selectedShift);
    }

    if (selectedGroup) {
      data = data.filter((row) => row.Group === selectedGroup);
    }

    if (selectedCategory) {
      data = data.filter((row) => row.Downtime_Category === selectedCategory);
    }

    if (filterValue) {
      data = data.filter((row) =>
        Object.values(row).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }

    setFilteredData(data);
  }, [
    filterValue,
    filterDate,
    selectedPlant,
    selectedShift,
    selectedGroup,
    selectedCategory,
    tableData,
  ]);

  const handleExport = () => {
    const formattedData = filteredData.map((row) => {
      const { Date, ...rest } = row;
      return {
        ...rest,
        issuedDate: formatDateOnly(Date),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    XLSX.writeFile(workbook, "downtime_export.xlsx");
  };

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white"></main>
        <h1 className="text-black text-2xl text-center font-bold">
          Downtime Report
        </h1>
        <br></br>
        <div
          style={{ display: "flex", alignItems: "center", margin: "10px 0" }}
        >
          <div className="relative flex items-center h-12 rounded-full focus-within:shadow-sm bg-gray-100 overflow-hidden">
            <div className="grid place-items-center h-full w-12 text-gray-300 px-3">
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
              className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-gray-50 px-3"
              type="text"
              id="filter"
              placeholder="Search anything..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="ml-6 border border-gray-300 text-black rounded px-3 py-2"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <select
            className="ml-6 border border-gray-300 text-black rounded px-3 py-2"
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
          >
            <option value="">All Plants</option>
            {[...new Set(tableData.map((row) => row.Unit))].map((plant) => (
              <option key={plant} value={plant}>
                {plant}
              </option>
            ))}
          </select>
          <select
            className="ml-3 border border-gray-300 text-black rounded px-3 py-2"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="">All Shifts</option>
            {[...new Set(tableData.map((row) => row.Shift))].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="ml-3 border border-gray-300 text-black rounded px-3 py-2"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">All Groups</option>
            {[...new Set(tableData.map((row) => row.Group))].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            className="ml-3 border border-gray-300 text-black rounded px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {[...new Set(tableData.map((row) => row.Downtime_Category))].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>
          <button
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 border border-blue-800 rounded ml-8"
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
                    Plant
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
                    Category
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Machine
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Sub-Machine
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Comments
                  </th>
                  <th scope="col" className="py-3 px-6">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9">Loading...</td>
                  </tr> // Fixed colSpan to 9
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr className="bg-white border-b" key={row.id}>
                      <td className="py-4 px-6">{row.id}</td>
                      <td className="py-4 px-6">{formatDateTime(row.Date)}</td>
                      <td className="py-4 px-6">{row.Unit}</td>
                      <td className="py-4 px-6">{row.Shift}</td>
                      <td className="py-4 px-6">{row.Group}</td>
                      <td className="py-4 px-6">{row.Line}</td>
                      <td className="py-4 px-6">{row.Downtime_Category}</td>
                      <td className="py-4 px-6">{row.Mesin}</td>
                      <td className="py-4 px-6">{row.Jenis}</td>
                      <td className="py-4 px-6">{row.Keterangan}</td>
                      <td className="py-4 px-6">{row.Minutes}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No data available</td>
                  </tr> // In case of empty data
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default ReportTable;
