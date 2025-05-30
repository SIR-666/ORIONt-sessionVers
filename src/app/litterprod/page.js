"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import MainLayout from "../mainLayout";
import DateRangePicker from "../components/DatePickRange";

const ReportLitterProd = () => {
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [filterValue, setFilterValue] = useState("");
  const [filterField, setFilterField] = useState("All"); // New state for the filter field

  const [loading, setLoading] = useState(false);
  const [plant, setPlant] = useState("");
  const [line, setLine] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [columnFilters, setColumnFilters] = useState({});
  const getTableColumns = (plant) => {
    if (plant === "Milk Processing" || plant === "Pasteurize Yogurt") {
      return [
        { key: "TanggalProduksi", label: "Date" },
        { key: "Line", label: "Line" },
        { key: "Shift", label: "Shift" },
        { key: "SKU_Name", label: "SKU" },
        { key: "FinishGoodPcs", label: "Finish Good (Packs)" },
        { key: "FinishGoodLiter", label: "Finish Good (Liter)" },
        { key: "BlowAwal", label: "Blow Awal" },
        { key: "DrainAkhir", label: "Drain Akhir" },
        { key: "Sirkulasi", label: "Sirkulasi" },
        { key: "UnplannedCIP", label: "Unplanned CIP" },
      ];
    } else {
      return [
        { key: "TanggalProduksi", label: "Date" },
        { key: "Line", label: "Line" },
        { key: "Shift", label: "Shift" },
        { key: "SKU_Name", label: "SKU" },
        { key: "FinishGoodPcs", label: "Finish Good (Packs)" },
        { key: "FinishGoodLiter", label: "Finish Good (Liter)" },
        { key: "RejectFillingPcs", label: "Reject Filling (Pcs)" },
        { key: "RejectPackingPcs", label: "Reject Packing  (Pcs)" },
        { key: "SamplePcs", label: "Sample  (Pcs)" },
      ];
    }
  };

  const columns = getTableColumns(plant);

  const displayedColumns = [
    { key: "TanggalProduksi", label: "TanggalProduksi" },
    { key: "Shift", label: "Shift" },
    { key: "Line", label: "Line" },
    { key: "SKU_Name", label: "SKU" },
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
        `http://10.24.0.81:3001/getFinishGoodLiter?plant=${plant}&line=${line}`
      );
      const newData = await response.json();
      console.log("data :", newData);

      setTableData(newData);
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
    let result = [...tableData];

    // Filter berdasarkan pencarian umum
    if (filterField && filterValue) {
      if (filterField === "All") {
        result = result.filter((row) =>
          Object.values(row).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(filterValue.toLowerCase())
          )
        );
      } else {
        result = result.filter((row) => {
          const value = row[filterField]?.toString()?.toLowerCase();
          return value && value.includes(filterValue.toLowerCase());
        });
      }
    }

    // Filter berdasarkan range tanggal
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      result = result.filter((row) => {
        if (!row.TanggalProduksi) return false;
        const parsedDate = new Date(row.TanggalProduksi.replace(" ", "T"));
        return parsedDate >= start && parsedDate <= end;
      });
    }

    // Filter berdasarkan filter per kolom
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) =>
          row[key]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    setFilteredData(result);
  }, [
    tableData,
    filterField,
    filterValue,
    dateRange,
    columnFilters,
    dateRange.startDate,
    dateRange.endDate,
  ]);

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

  const totalLiter = filteredData.reduce((sum, row) => {
    const val = parseFloat(row.FinishGoodLiter || row.Hasil_Prod_aft_loss || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalPacks = filteredData.reduce((sum, row) => {
    const val = parseFloat(row.FinishGoodPcs || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  // useEffect(() => {
  //   let filtered = tableData;

  //   Object.entries(columnFilters).forEach(([key, value]) => {
  //     if (value) {
  //       filtered = filtered.filter((row) =>
  //         row[key]?.toString().toLowerCase().includes(value.toLowerCase())
  //       );
  //     }
  //   });

  //   setFilteredData(filtered);
  // }, [columnFilters, tableData]);

  const totals = {
    FinishGoodPcs: 0,
    FinishGoodLiter: 0,
    BlowAwal: 0,
    DrainAkhir: 0,
    Sirkulasi: 0,
    UnplannedCIP: 0,
    RejectFillingPcs: 0,
    RejectPackingPcs: 0,
    SamplePcs: 0,
  };

  filteredData.forEach((row) => {
    Object.keys(totals).forEach((key) => {
      const val = parseFloat(row[key] || 0);
      if (!isNaN(val)) totals[key] += val;
    });
  });

  return (
    <>
      <MainLayout>
        <main className="flex-1 p-8 bg-white"></main>
        <h1 className="text-black text-2xl text-center font-bold">
          Finish Good Report
        </h1>
        <br></br>
        <div
          style={{ display: "flex", alignItems: "center", margin: "10px 0" }}
        >
          <DateRangePicker
            onChange={(range) => {
              console.log("Tanggal berubah:", range);
              setDateRange({
                startDate: new Date(range.startDate),
                endDate: new Date(range.endDate),
              });
            }}
          />
        </div>

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

          <div className="px-3 font-bold text-black">
            <td colSpan="3" className="text-right pr-4">
              Total Packs (Pcs) :
            </td>
            <td>{totalPacks}</td>
          </div>

          <div className="px-3 font-bold text-black">
            <td colSpan="3" className="text-right pr-4">
              Total (Liter) :
            </td>
            <td>{totalLiter.toFixed(2)}</td>
          </div>
          {/* <button
            className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 border border-blue-800 rounded ml-10"
            onClick={handleExport}
          >
            Export to Excel
          </button> */}
        </div>

        <div className="relative w-full h-128 rounded-xl bg-white shadow-xl">
          <div
            className="relative w-full overflow-y-auto flex flex-col h-full px-5"
            style={{ maxHeight: "350px", overflowY: "auto" }}
          >
            <table className="w-full text-sm text-left text-gray-500">
              {/* <thead className="py-3 text-xs text-gray-700 uppercase bg-blue-300 sticky top-0 z-20">
                <tr>
                  <th>Date</th>
                  <th>Line</th>
                  <th>Shift</th>
                  <th>SKU</th>
                  <th>Finish Good (Packs)</th>
                  <th>Finish Good (Liter)</th>
                </tr>
              </thead> */}

              <thead className="py-3 text-xs text-gray-700 uppercase bg-blue-300 sticky top-0 z-20">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="align-top">
                      <div className="flex flex-col w-full">
                        <span>{col.label}</span>
                        <input
                          type="text"
                          placeholder="Filter"
                          className="text-xs p-1 rounded bg-white border border-gray-300 w-full"
                          value={columnFilters[col.key] || ""}
                          onChange={(e) =>
                            handleColumnFilterChange(col.key, e.target.value)
                          }
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length}>Loading...</td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr className="bg-white border-b" key={row.ID}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {typeof row[col.key] === "number"
                            ? parseFloat(row[col.key]).toFixed(
                                col.key.includes("Liter") ? 2 : 0
                              )
                            : row[col.key] || "0"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length}>No data available</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-bold text-black">
                <tr>
                  {columns.map((col, index) => (
                    <td key={col.key}>
                      {totals.hasOwnProperty(col.key)
                        ? col.key.includes("Liter")
                          ? totals[col.key].toFixed(2)
                          : totals[col.key]
                        : index === 0
                        ? "Total"
                        : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default ReportLitterProd;
