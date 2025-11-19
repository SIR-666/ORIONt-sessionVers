// "use client";
// import { useEffect, useState, useRef } from "react";
// // import { Notyf } from "notyf";
// // import "notyf/notyf.min.css";
// import * as XLSX from "xlsx";
// import MainLayout from "../mainLayout";

// // Helper functions untuk PERFORMA
// const getShiftHours = (shift) => {
//   if (shift === "Shift 1") return [6, 7, 8, 9, 10, 11, 12, 13, 14];
//   if (shift === "Shift 2") return [14, 15, 16, 17, 18, 19, 20, 21, 22];
//   if (shift === "Shift 3") return [22, 23, 0, 1, 2, 3, 4, 5, 6];
//   return [];
// };

// const parseWIBNaive = (ts) => {
//   if (!ts) return null;
//   const stripTZ = (s) => String(s ?? "").replace(/([Zz]|[+-]\d{2}:?\d{2})$/, "");
//   const raw = stripTZ(ts);
//   const match = raw.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
//   if (match) {
//     const [, date, HH, MM, SS = "00"] = match;
//     return new Date(`${date}T${HH}:${MM}:${SS}`);
//   }
//   return new Date(ts);
// };

// const parseHourLoose = (s) => {
//   const m = String(s ?? "").match(/\b(\d{1,2})(?::\d{2})?\b/);
//   if (!m) return undefined;
//   const h = Number(m[1]);
//   return Number.isFinite(h) ? h : undefined;
// };

// const selectedHourFromInspection = (ins) => {
//   const candidates = [
//     ins?.hourSlot, ins?.hour_slot,
//     ins?.timeSlot, ins?.time_slot,
//     ins?.hour, ins?.selectedHour, ins?.hourSelected
//   ];
//   for (const c of candidates) {
//     const h = parseHourLoose(c);
//     if (h !== undefined) return h;
//   }
//   return undefined;
// };

// const selectedHourFromRecord = (rec) => {
//   const g = rec?.HourGroup ?? rec?.hourGroup ?? rec?.hour_slot ??
//     rec?.hourSlot ?? rec?.timeSlot ?? rec?.selectedHour ?? rec?.hour;
//   const rg = String(g ?? "");
//   const mRange = rg.match(/(\d{1,2})(?::\d{2})?\s*[-–]\s*(\d{1,2})/);
//   if (mRange) return Number(mRange[1]);
//   return parseHourLoose(rg);
// };

// const parseCombinedInspections = (rec) => {
//   const chunks = String(rec?.CombinedInspectionData || "").match(/\[[\s\S]*?\]/g) || [];
//   const out = [];
//   for (const txt of chunks) {
//     try {
//       const arr = JSON.parse(txt);
//       if (Array.isArray(arr)) out.push(...arr);
//     } catch { }
//   }
//   return out;
// };

// const extractUniqueInspectionData = (records) => {
//   const uniqueActivities = {};
//   const safe = Array.isArray(records) ? [...records] : [];

//   const isNonEmpty = (v) =>
//     v !== undefined &&
//     v !== null &&
//     String(v).trim() !== "" &&
//     String(v).trim() !== "-";

//   for (const record of safe) {
//     try {
//       const chunks = String(record?.CombinedInspectionData || "").match(/\[[\s\S]*?\]/g);
//       if (!chunks || chunks.length === 0) continue;

//       for (const txt of chunks) {
//         let arr = [];
//         try {
//           arr = JSON.parse(txt);
//         } catch {
//           arr = [];
//         }

//         for (const inspection of arr) {
//           const key = `${inspection.id}|${inspection.activity}`;
//           if (!uniqueActivities[key]) {
//             uniqueActivities[key] = {
//               activity: inspection.activity,
//               standard: inspection.standard,
//               good: inspection.good ?? "-",
//               need: inspection.need ?? "-",
//               reject: inspection.reject ?? "-",
//               results: {},
//               picture: {},
//             };
//           }

//           const selectedH = selectedHourFromInspection(inspection) ?? selectedHourFromRecord(record);
//           if (selectedH !== undefined && isNonEmpty(inspection.results)) {
//             uniqueActivities[key].results[selectedH] = String(inspection.results);
//             if (inspection.picture) {
//               uniqueActivities[key].picture[selectedH] = inspection.picture;
//             }
//           }
//         }
//       }
//     } catch (e) {
//       console.error("Error parsing CombinedInspectionData:", e);
//     }
//   }

//   return Object.values(uniqueActivities);
// };

// const evaluateValue = (inputValue, goodCriteria, rejectCriteria) => {
//   const numValue = parseFloat(inputValue);
//   if (isNaN(numValue)) return "default";

//   const parseRange = (s) => {
//     if (!s || s === "-") return null;
//     const m = String(s).match(/^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/);
//     return m ? { type: "range", min: parseFloat(m[1]), max: parseFloat(m[2]) } : null;
//   };

//   const parseReject = (s) => {
//     if (!s || s === "-") return null;
//     return String(s)
//       .split("/")
//       .map((t) => t.trim())
//       .map((t) => {
//         const m = t.match(/^(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
//         return m ? { operator: m[1], value: parseFloat(m[2]) } : null;
//       })
//       .filter(Boolean);
//   };

//   const goodRange = parseRange(goodCriteria);
//   const rejectConditions = parseReject(rejectCriteria);

//   if (rejectConditions) {
//     for (const cond of rejectConditions) {
//       if (cond.operator === "<" && numValue < cond.value) return "reject";
//       if (cond.operator === ">" && numValue > cond.value) return "reject";
//       if (cond.operator === ">=" && numValue >= cond.value) return "reject";
//       if (cond.operator === "<=" && numValue <= cond.value) return "reject";
//     }
//   }

//   if (goodRange) {
//     if (numValue >= goodRange.min && numValue <= goodRange.max) return "good";
//   }

//   return "need";
// };

// const getResultColor = (result, good, reject) => {
//   if (["G", "N", "R"].includes(result)) {
//     if (result === "G") return "bg-green-100 text-green-800";
//     if (result === "N") return "bg-yellow-100 text-yellow-800";
//     if (result === "R") return "bg-red-100 text-red-800";
//   }
//   const evalResult = evaluateValue(result, good, reject);
//   if (evalResult === "good") return "bg-green-100 text-green-800";
//   if (evalResult === "need") return "bg-yellow-100 text-yellow-800";
//   if (evalResult === "reject") return "bg-red-100 text-red-800";
//   return "bg-gray-50 text-gray-600";
// };

// const CILTApproval = () => {
//   const [tableData, setTableData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [filterValue, setFilterValue] = useState("");
//   const [filterDate, setFilterDate] = useState("");
//   const [selectedPlant, setSelectedPlant] = useState("");
//   const [selectedLine, setSelectedLine] = useState("");
//   const [selectedShift, setSelectedShift] = useState("");
//   const [selectedPackage, setSelectedPackage] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("pending");
//   const [loading, setLoading] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [username, setUsername] = useState("");
//   const [roleId, setRoleId] = useState("");
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [confirmAction, setConfirmAction] = useState(null);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   // const notyfRef = useRef(null);
//   // const TOAST_TOP_OFFSET = 72;

//   // useEffect(() => {
//   //   if (typeof window !== "undefined" && !notyfRef.current) {
//   //     notyfRef.current = {
//   //       success: (msg) => console.log("SUCCESS:", msg),
//   //       error: (msg) => console.error("ERROR:", msg),
//   //       open: (obj) => console.log("INFO:", obj.message),
//   //     };
//   //   }
//   // }, []);

//   const [toasts, setToasts] = useState([]);

//   // Toast System
//   const addToast = (message, type = "info") => {
//     const id = Date.now();
//     setToasts(prev => [...prev, { id, message, type }]);
//     setTimeout(() => {
//       setToasts(prev => prev.filter(t => t.id !== id));
//     }, 4000);
//   };

//   const toast = {
//     success: (m) => addToast(m, "success"),
//     error: (m) => addToast(m, "error"),
//     info: (m) => addToast(m, "info"),
//     warn: (m) => addToast(m, "warning"),
//   };

//   // Custom Confirmation Modal Component
//   const ConfirmModal = ({ show, onClose, onConfirm, item, type = "approve" }) => {
//     if (!show) return null;

//     const isApprove = type === "approve";
//     const [rejectReason, setRejectReason] = useState("");

//     const handleConfirm = () => {
//       if (!isApprove && !rejectReason.trim()) {
//         toast.warn("Alasan penolakan harus diisi!");
//         return;
//       }
//       onConfirm(isApprove ? null : rejectReason);
//       setRejectReason("");
//     };

//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
//           {/* Header */}
//           <div className={`${isApprove ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} px-6 py-5`}>
//             <div className="flex items-center gap-3">
//               <div className={`${isApprove ? 'bg-white/20' : 'bg-white/20'} p-3 rounded-full`}>
//                 {isApprove ? (
//                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                   </svg>
//                 ) : (
//                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 )}
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold text-white">
//                   {isApprove ? 'Konfirmasi Approval' : 'Konfirmasi Penolakan'}
//                 </h3>
//                 <p className="text-white/90 text-sm mt-0.5">
//                   {isApprove ? 'Pastikan data sudah benar' : 'Tindakan ini tidak dapat dibatalkan'}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="px-6 py-5">
//             <div className="space-y-3 mb-5">
//               <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
//                 <div className="flex items-start">
//                   <span className="text-gray-500 text-sm w-32 flex-shrink-0">Process Order:</span>
//                   <span className="text-gray-900 font-semibold text-sm">{item?.processOrder}</span>
//                 </div>
//                 <div className="flex items-start">
//                   <span className="text-gray-500 text-sm w-32 flex-shrink-0">Package:</span>
//                   <span className="text-gray-900 font-medium text-sm">{item?.packageType}</span>
//                 </div>
//                 <div className="flex items-start">
//                   <span className="text-gray-500 text-sm w-32 flex-shrink-0">Plant - Line:</span>
//                   <span className="text-gray-900 font-medium text-sm">{item?.plant} - {item?.line}</span>
//                 </div>
//                 <div className="flex items-start">
//                   <span className="text-gray-500 text-sm w-32 flex-shrink-0">Shift:</span>
//                   <span className="text-gray-900 font-medium text-sm">{item?.shift}</span>
//                 </div>
//                 <div className="flex items-start">
//                   <span className="text-gray-500 text-sm w-32 flex-shrink-0">Product:</span>
//                   <span className="text-gray-900 font-medium text-sm">{item?.product}</span>
//                 </div>
//               </div>

//               {!isApprove && (
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Alasan Penolakan <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none bg-white text-gray-900 placeholder-gray-500 caret-gray-700 selection:bg-red-100 selection:text-gray-900"
//                     rows="3"
//                     placeholder="Masukkan alasan penolakan..."
//                     value={rejectReason}
//                     onChange={(e) => setRejectReason(e.target.value)}
//                     autoFocus
//                   />
//                 </div>
//               )}

//               {isApprove && (
//                 <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
//                   <div className="flex items-start">
//                     <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                     </svg>
//                     <p className="text-sm text-blue-800">
//                       Anda akan menyetujui item ini sebagai <span className="font-bold">{userRole === "Coor" ? "Coordinator" : "Supervisor"}</span>
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3">
//               <button
//                 onClick={onClose}
//                 className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-200"
//               >
//                 Batal
//               </button>
//               <button
//                 onClick={handleConfirm}
//                 className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 focus:ring-2 ${isApprove
//                   ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300'
//                   : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300'
//                   }`}
//               >
//                 {isApprove ? 'Ya, Setujui' : 'Ya, Tolak'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Detail Modal Component
//   const DetailModal = ({ show, onClose, item }) => {
//     if (!show || !item) return null;

//     const inspectionData = (() => {
//       try {
//         return JSON.parse(item.inspectionData || "[]");
//       } catch {
//         return [];
//       }
//     })();

//     const renderDetailContent = () => {
//       const packageType = item.packageType;

//       if (packageType === "PERFORMA RED AND GREEN") {
//         const [performaRecords, setPerformaRecords] = useState([]);
//         const [isLoadingPerforma, setIsLoadingPerforma] = useState(true);

//         useEffect(() => {
//           const fetchPerformaData = async () => {
//             if (packageType !== "PERFORMA RED AND GREEN") return;

//             setIsLoadingPerforma(true);
//             try {
//               const formattedDate = item.date.split("T")[0];
//               const response = await fetch(
//                 `http://10.24.0.81:3009/cilt/reportCILTAll/PERFORMA RED AND GREEN/${encodeURIComponent(
//                   item.plant
//                 )}/${encodeURIComponent(item.line)}/${encodeURIComponent(
//                   item.shift
//                 )}/${encodeURIComponent(item.machine)}/${formattedDate}`
//               );

//               if (response.ok) {
//                 const data = await response.json();
//                 setPerformaRecords(Array.isArray(data) ? data : []);
//               } else {
//                 setPerformaRecords([]);
//               }
//             } catch (error) {
//               console.error("Error fetching PERFORMA data:", error);
//               setPerformaRecords([]);
//             } finally {
//               setIsLoadingPerforma(false);
//             }
//           };

//           fetchPerformaData();
//         }, [packageType, item]);

//         if (isLoadingPerforma) {
//           return (
//             <div className="flex items-center justify-center py-8">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//               <span className="ml-3 text-gray-600">Loading inspection data...</span>
//             </div>
//           );
//         }

//         const shiftHours = getShiftHours(item.shift);
//         const filteredRecords = performaRecords.filter((rec) => {
//           const samePlant = rec.plant === item.plant;
//           const sameLine = rec.line === item.line;
//           const sameShift = rec.shift === item.shift;
//           const sameMachine = rec.machine === item.machine;
//           const sameOrder =
//             String(rec.processOrder || "").trim().toLowerCase() ===
//             String(item.processOrder || "").trim().toLowerCase();

//           return samePlant && sameLine && sameShift && sameMachine && sameOrder;
//         });

//         const recordsToRender =
//           filteredRecords.length > 0
//             ? filteredRecords
//             : performaRecords.filter(
//               (rec) =>
//                 String(rec.processOrder || "").trim().toLowerCase() ===
//                 String(item.processOrder || "").trim().toLowerCase()
//             );

//         const uniqueData = extractUniqueInspectionData(recordsToRender);
//         const actualTimeMap = new Map();
//         recordsToRender.forEach((rec) => {
//           const ts = parseWIBNaive(
//             rec?.submitTime || rec?.submit_time || rec?.createdAt || rec?.created_at
//           );
//           if (!ts) return;
//           const hour = ts.getHours();
//           if (!shiftHours.includes(hour)) return;
//           if (!actualTimeMap.has(hour)) actualTimeMap.set(hour, []);
//           actualTimeMap.get(hour).push({
//             time: ts,
//             label: `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`,
//           });
//         });

//         actualTimeMap.forEach((arr) => arr.sort((a, b) => a.time - b.time));
//         const finalUniqueData = uniqueData.length > 0
//           ? uniqueData
//           : extractUniqueInspectionData(performaRecords);

//         return (
//           <div className="space-y-4">
//             {/* Legend */}
//             <div className="flex gap-4 justify-center text-xs mb-4">
//               <div className="flex items-center gap-2">
//                 <span className="w-4 h-4 rounded bg-green-100 border border-green-300"></span>
//                 <span className="text-gray-700">Good (G)</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></span>
//                 <span className="text-gray-700">Need Attention (N)</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="w-4 h-4 rounded bg-red-100 border border-red-300"></span>
//                 <span className="text-gray-700">Reject (R)</span>
//               </div>
//             </div>

//             {/* Table Container with Horizontal Scroll */}
//             <div className="overflow-x-auto border rounded-lg">
//               <table className="min-w-full divide-y divide-gray-200 text-xs">
//                 <thead className="bg-green-600 text-white sticky top-0">
//                   {/* Actual Time Row */}
//                   <tr>
//                     <th colSpan="5" className="px-3 py-2 text-center font-bold border-r border-green-700">
//                       Actual Time
//                     </th>
//                     {shiftHours.map((hour) => {
//                       const related = actualTimeMap.get(hour) || [];
//                       return (
//                         <th key={`time-${hour}`} className="px-2 py-2 text-center border-r border-green-700">
//                           {related.length === 0 ? (
//                             <span className="text-gray-300">-</span>
//                           ) : (
//                             <div className="flex flex-col gap-1">
//                               {related.map((rec, idx) => {
//                                 const isLate = Math.abs(rec.time.getHours() - hour) >= 1;
//                                 return (
//                                   <span
//                                     key={idx}
//                                     className={`inline-block px-2 py-1 rounded text-xs font-semibold ${isLate
//                                       ? 'bg-red-100 text-red-800'
//                                       : 'bg-green-100 text-green-800'
//                                       }`}
//                                   >
//                                     {rec.label}
//                                   </span>
//                                 );
//                               })}
//                             </div>
//                           )}
//                         </th>
//                       );
//                     })}
//                   </tr>

//                   {/* Header Row */}
//                   <tr>
//                     <th className="px-3 py-2 text-left w-12">No</th>
//                     <th className="px-3 py-2 text-left w-64">Activity</th>
//                     <th className="px-3 py-2 text-center w-16">G</th>
//                     <th className="px-3 py-2 text-center w-16">N</th>
//                     <th className="px-3 py-2 text-center w-16 border-r border-green-700">R</th>
//                     {shiftHours.map((hour) => (
//                       <th key={`hour-${hour}`} className="px-2 py-2 text-center w-20 border-r border-green-700">
//                         {String(hour).padStart(2, '0')}:00
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {finalUniqueData.length === 0 ? (
//                     <tr>
//                       <td colSpan={5 + shiftHours.length} className="px-3 py-8 text-center text-gray-500">
//                         <div className="flex flex-col items-center gap-2">
//                           <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                           </svg>
//                           <p>No inspection data available</p>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     finalUniqueData.map((row, index) => (
//                       <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                         <td className="px-3 py-2 text-center text-gray-900">{index + 1}</td>
//                         <td className="px-3 py-2 text-gray-900 font-medium">{row.activity}</td>
//                         <td className="px-3 py-2 text-center text-gray-700">{row.good ?? "-"}</td>
//                         <td className="px-3 py-2 text-center text-gray-700">{row.need ?? "-"}</td>
//                         <td className="px-3 py-2 text-center text-gray-700 border-r">{row.reject ?? "-"}</td>
//                         {shiftHours.map((hour) => {
//                           const val = row.results?.[hour];
//                           const colorClass = val ? getResultColor(val, row.good, row.reject) : "bg-gray-50 text-gray-400";
//                           return (
//                             <td
//                               key={`cell-${index}-${hour}`}
//                               className={`px-2 py-2 text-center font-bold border-r ${colorClass}`}
//                             >
//                               {val || "-"}
//                             </td>
//                           );
//                         })}
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Summary */}
//             <div className="bg-blue-50 p-4 rounded-lg mt-4">
//               <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <div>
//                   <span className="text-blue-700">Total Activities:</span>
//                   <span className="ml-2 font-bold text-blue-900">{uniqueData.length}</span>
//                 </div>
//                 <div>
//                   <span className="text-blue-700">Shift Hours:</span>
//                   <span className="ml-2 font-bold text-blue-900">{shiftHours.length} hours</span>
//                 </div>
//                 <div>
//                   <span className="text-blue-700">Total Records:</span>
//                   <span className="ml-2 font-bold text-blue-900">{performaRecords.length}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       }

//       if (packageType === "SEGREGASI") {
//         return (
//           <div className="overflow-x-auto pb-6 px-2">
//             <div className="flex gap-6 min-w-max">
//               {inspectionData.map((r, i) => {
//                 const type = r.type?.toLowerCase() || "-";

//                 const typeStyle =
//                   type === "start"
//                     ? {
//                       bg: "bg-blue-50",
//                       text: "text-blue-700",
//                       icon: (
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
//                           <path d="M8 5v14l11-7z" />
//                         </svg>
//                       ),
//                     }
//                     : type === "change variant"
//                       ? {
//                         bg: "bg-purple-50",
//                         text: "text-purple-700",
//                         icon: (
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                             <path d="M17 10h4l-4-4m4 8h-4l4 4M3 6h9M3 18h9" />
//                           </svg>
//                         ),
//                       }
//                       : {
//                         bg: "bg-emerald-50",
//                         text: "text-emerald-700",
//                         icon: (
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
//                             <circle cx="12" cy="12" r="5" />
//                           </svg>
//                         ),
//                       };

//                 return (
//                   <div
//                     key={i}
//                     className="flex-shrink-0 w-80 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out p-5 animate-fadeSlideIn"
//                   >
//                     {/* Header */}
//                     <div className="flex items-center justify-between mb-3">
//                       <h3 className="text-base font-semibold text-gray-800">Entry {i + 1}</h3>
//                       <span className={`${typeStyle.bg} ${typeStyle.text} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium`}>
//                         {typeStyle.icon}
//                         <span className="capitalize">{r.type || "-"}</span>
//                       </span>
//                     </div>

//                     {/* Info utama */}
//                     <div className="flex flex-col space-y-1 text-sm text-gray-700">
//                       <p><span className="font-medium text-gray-500">Flavour:</span> {r.flavour || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Kode Prod:</span> {r.kodeProd || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Kode Exp:</span> {r.kodeExp || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Start:</span> {r.start || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Stop:</span> {r.stop || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Outfeed:</span> {r.outfeed || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Total Outfeed:</span> {r.totalOutfeed || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Waste:</span> {r.waste || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Start (Hours):</span> {r.startHours || "-"}</p>
//                       <p><span className="font-medium text-gray-500">Stop (Hours):</span> {r.stopHours || "-"}</p>

//                       {/* Type di bawah Stop Hours */}
//                       <p>
//                         <span className="font-medium text-gray-500">Type:</span>{" "}
//                         <span className="capitalize text-gray-800 font-semibold">{r.type || "-"}</span>
//                       </p>

//                       <p><span className="font-medium text-gray-500">Prod Type:</span> {r.prodType || "-"}</p>
//                       <p><span className="font-medium text-gray-500">TO:</span> {r.to || "-"}</p>
//                     </div>

//                     {/* Equipment */}
//                     <div className="mt-4 border-t pt-3">
//                       <p className="text-xs font-semibold text-emerald-700 mb-2">Equipment Status</p>
//                       <div className="flex flex-wrap gap-2">
//                         {r.magazine && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Magazine ✓</span>}
//                         {r.wastafel && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Wastafel ✓</span>}
//                         {r.palletPm && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Pallet PM ✓</span>}
//                         {r.conveyor && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Conveyor ✓</span>}
//                         {!r.magazine && !r.wastafel && !r.palletPm && !r.conveyor && (
//                           <span className="text-gray-400 text-xs">No equipment checked</span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Footer user/time */}
//                     {(r.user || r.time) && (
//                       <div className="mt-4 border-t pt-2 text-xs text-gray-500">
//                         {r.user && <>User: {r.user}</>}
//                         {r.time && <> | Time: {r.time}</>}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         );
//       }

//       if (packageType === "PEMAKAIAN SCREW CAP") {
//         return (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200 text-gray-900">
//               <thead className="bg-gray-50 text-gray-700">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Jam</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">OF No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Box No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty Label</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {inspectionData.map((row, idx) => (
//                   <tr key={idx}>
//                     <td className="px-3 py-2 text-sm text-black">{idx + 1}</td>
//                     <td className="px-3 py-2 text-sm text-black">{row.jam}</td>
//                     <td className="px-3 py-2 text-sm text-black">{row.ofNo || "-"}</td>
//                     <td className="px-3 py-2 text-sm text-black">{row.boxNo || "-"}</td>
//                     <td className="px-3 py-2 text-sm text-black">{row.qtyLabel || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         );
//       }

//       if (packageType === "PEMAKAIAN PAPER") {
//         return (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Jam</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Box No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">PD Paper</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty Label</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {inspectionData.map((row, idx) => (
//                   <tr key={idx}>
//                     <td className="px-3 py-2 text-sm">{idx + 1}</td>
//                     <td className="px-3 py-2 text-sm text-gray-900">{row.jam}</td>
//                     <td className="px-3 py-2 text-sm">{row.boxNo || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.pdPaper || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.qtyLabel || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         );
//       }

//       if (packageType === "PENGECEKAN H2O2 ( SPRAY )") {
//         return (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Jam</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Konsentrasi</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Volume</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kode</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {inspectionData.map((row, idx) => (
//                   <tr key={idx}>
//                     <td className="px-3 py-2 text-sm">{idx + 1}</td>
//                     <td className="px-3 py-2 text-sm">{row.jam}</td>
//                     <td className="px-3 py-2 text-sm">{row.konsentrasi || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.volume || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.kode || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         );
//       }

//       if (packageType === "CHECKLIST CILT") {
//         return (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Job Type</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Component</th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Result</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {inspectionData.map((row, idx) => (
//                   <tr key={idx}>
//                     <td className="px-3 py-2 text-sm">{idx + 1}</td>
//                     <td className="px-3 py-2 text-sm">{row.job_type || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.componen || "-"}</td>
//                     <td className="px-3 py-2 text-sm">{row.results || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         );
//       }

//       return (
//         <div className="text-center py-8 text-gray-500">
//           <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//           </svg>
//           <p className="mt-2">Detail view not available for this package type</p>
//         </div>
//       );
//     };

//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
//         <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-hidden animate-scale-in">
//           {/* Header */}
//           <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="bg-white/20 p-3 rounded-full">
//                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-white">Detail {item.packageType}</h3>
//                   <p className="text-white/90 text-sm mt-0.5">Process Order: {item.processOrder}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           <div className="p-6 text-gray-900 overflow-y-auto max-h-[70vh]">
//             {/* Info Section */}
//             <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
//               <div>
//                 <span className="text-gray-500 text-sm">Plant:</span>
//                 <span className="ml-2 font-semibold text-gray-900">{item.plant}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500 text-sm">Line:</span>
//                 <span className="ml-2 font-semibold text-gray-900">{item.line}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500 text-sm">Shift:</span>
//                 <span className="ml-2 font-semibold text-gray-900">{item.shift}</span>
//               </div>
//               <div>
//                 <span className="text-gray-500 text-sm">Machine:</span>
//                 <span className="ml-2 font-semibold text-gray-900">{item.machine}</span>
//               </div>
//               <div className="col-span-2">
//                 <span className="text-gray-500 text-sm">Product:</span>
//                 <span className="ml-2 font-semibold text-gray-900">{item.product}</span>
//               </div>
//             </div>

//             {/* Detail Content */}
//             {renderDetailContent()}
//           </div>

//           {/* Footer */}
//           <div className="bg-gray-50 px-6 py-4 flex justify-end sticky bottom-0 border-t border-gray-200 z-10">
//             <button
//               onClick={onClose}
//               className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Get user data from session storage
//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const role = sessionStorage.getItem("role");
//     const user = sessionStorage.getItem("username");
//     const roleId = sessionStorage.getItem("roleId");
//     setRoleId(roleId);

//     console.log("User Role from sessionStorage:", role);
//     console.log("Username from sessionStorage:", user);

//     setUserRole(role);
//     setUsername(user || "Unknown User");
//   }, []);

//   const formatDateTime = (dateString) => {
//     if (!dateString || typeof dateString !== "string") {
//       return "N/A";
//     }
//     const validDateString = dateString.replace(" ", "T");
//     const date = new Date(validDateString);
//     return `${date.getUTCDate().toString().padStart(2, "0")}/${(
//       date.getUTCMonth() + 1
//     )
//       .toString()
//       .padStart(2, "0")}/${date.getUTCFullYear()} ${date
//         .getUTCHours()
//         .toString()
//         .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
//   };

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const endpoints = [
//         "http://10.24.0.81:3009/cilt?status=0",
//       ];

//       let newData = null;
//       let successEndpoint = "";

//       for (const endpoint of endpoints) {
//         try {
//           console.log(`Trying endpoint: ${endpoint}`);
//           const response = await fetch(endpoint);

//           if (response.ok) {
//             newData = await response.json();
//             successEndpoint = endpoint;
//             console.log(`✅ Success with endpoint: ${endpoint}`);
//             break;
//           } else {
//             console.log(`❌ Failed with endpoint: ${endpoint} (${response.status})`);
//           }
//         } catch (err) {
//           console.log(`❌ Error with endpoint: ${endpoint}`, err.message);
//         }
//       }

//       if (!newData) {
//         throw new Error("All API endpoints failed. Please check your backend configuration.");
//       }

//       console.log("Fetched CILT Data:", newData);
//       console.log("Total items:", newData?.length || 0);
//       console.log("Using endpoint:", successEndpoint);

//       if (newData && newData.length > 0) {
//         console.log("Sample item:", newData[0]);
//         console.log("Available fields:", Object.keys(newData[0]));
//       }

//       setTableData(newData || []);
//       setFilteredData(newData || []);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       console.error("Error details:", error.message);
//       toast.error("Gagal memuat data CILT. Cek koneksi/endpoint.");
//       setTableData([]);
//       setFilteredData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (userRole) {
//       fetchData();
//     }
//   }, [userRole]);

//   const deduplicatePerforma = (data) => {
//     const latestMap = new Map();

//     data.forEach((row) => {
//       if (row.packageType !== "PERFORMA RED AND GREEN") return;

//       const key = `${row.processOrder}|${row.product}`;
//       const existing = latestMap.get(key);
//       const rowDate = new Date(row.date);
//       const existingDate = existing ? new Date(existing.date) : null;

//       if (!existing || rowDate > existingDate) {
//         latestMap.set(key, row);
//       }
//     });

//     const nonPerforma = data.filter((r) => r.packageType !== "PERFORMA RED AND GREEN");
//     const latestPerforma = Array.from(latestMap.values());
//     return [...nonPerforma, ...latestPerforma];
//   };

//   useEffect(() => {
//     let data = [...tableData];

//     if (filterDate) {
//       data = data.filter((row) => {
//         const rowDate = new Date(row.date);
//         const formatted = rowDate.toISOString().split("T")[0];
//         return formatted === filterDate;
//       });
//     }

//     if (selectedPlant) {
//       data = data.filter((row) => row.plant === selectedPlant);
//     }

//     if (selectedLine) {
//       data = data.filter((row) => row.line === selectedLine);
//     }

//     if (selectedShift) {
//       data = data.filter((row) => row.shift === selectedShift);
//     }

//     if (selectedPackage) {
//       data = data.filter((row) => row.packageType === selectedPackage);
//     }

//     if (selectedStatus === "pending") {
//       data = data.filter((row) => {
//         const coorPending = row.approval_coor === 0 || row.approval_coor === null;
//         const spvPending = row.approval_spv === 0 || row.approval_spv === null;
//         const notRejected = row.status !== -1;

//         return notRejected && (coorPending || spvPending);
//       });
//     } else if (selectedStatus === "approved") {
//       data = data.filter((row) => row.approval_coor === 1 && row.approval_spv === 1);
//     } else if (selectedStatus === "rejected") {
//       data = data.filter((row) => row.status === -1 || row.approval_coor === -1 || row.approval_spv === -1);
//     }

//     if (filterValue) {
//       data = data.filter((row) =>
//         Object.values(row).some(
//           (value) =>
//             value &&
//             value.toString().toLowerCase().includes(filterValue.toLowerCase())
//         )
//       );
//     }

//     const cleanedData = deduplicatePerforma(data);
//     const sortedData = [...cleanedData].sort((a, b) => {
//       const dateA = new Date(a.date);
//       const dateB = new Date(b.date);
//       return dateB - dateA;
//     });
//     console.log("Filtered (deduplicated & sorted) data count:", sortedData.length);
//     setFilteredData(sortedData);
//   }, [
//     filterValue,
//     filterDate,
//     selectedPlant,
//     selectedLine,
//     selectedShift,
//     selectedPackage,
//     selectedStatus,
//     tableData,
//     userRole,
//   ]);

//   const handleViewDetail = (item) => {
//     setSelectedItem(item);
//     setShowDetailModal(true);
//   };

//   const handleApprove = async (item) => {
//     setConfirmAction({
//       type: "approve",
//       item,
//       execute: async () => {
//         try {
//           let endpoint = "";

//           if (userRole === "Prf" || userRole === "Mgr") {
//             if (item.approval_coor === 0) {
//               endpoint = `http://10.24.0.81:3009/cilt/approve-coordinator/${item.id}`;
//             } else if (item.approval_coor === 1 && item.approval_spv === 0) {
//               endpoint = `http://10.24.0.81:3009/cilt/approve-supervisor/${item.id}`;
//             } else {
//               toast.info("Item sudah di-approve.");
//               return;
//             }
//           } else if (userRole === "Coor") {
//             endpoint = `http://10.24.0.81:3009/cilt/approve-coordinator/${item.id}`;
//           } else if (userRole === "Spv") {
//             endpoint = `http://10.24.0.81:3009/cilt/approve-supervisor/${item.id}`;
//           } else {
//             toast.error("Anda tidak punya izin untuk approve");
//             return;
//           }

//           const response = await fetch(endpoint, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, role: roleId }),
//           });

//           if (response.ok) {
//             const label = endpoint.includes("approve-coordinator") ? "Coordinator" : "Supervisor";
//             let approvedBy = username;
//             try {
//               if (response.headers.get("content-type")?.includes("application/json")) {
//                 const data = await response.json();
//                 approvedBy = data?.approved_by ?? data?.approver ?? data?.user ?? username;
//               }
//             } catch { }
//             toast.success(`${label} Approved. Approved by ${approvedBy}.`);
//             fetchData();
//           } else {
//             let errMsg = "Failed to approve";
//             try {
//               const error = await response.json();
//               errMsg = error.message || errMsg;
//             } catch { }
//             toast.error(`Error ${response.status}: ${errMsg}`);
//           }
//         } catch (error) {
//           console.error("Error approving:", error);
//           toast.error(error?.message || "Failed to approve item");
//         } finally {
//           setShowConfirmModal(false);
//           setConfirmAction(null);
//         }
//       }
//     });
//     setShowConfirmModal(true);
//   };

//   const handleReject = async (item) => {
//     setConfirmAction({
//       type: "reject",
//       item,
//       execute: async (reason) => {
//         try {
//           const response = await fetch(`http://10.24.0.81:3009/cilt/reject/${item.id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ username, reason }),
//           });

//           if (response.ok) {
//             toast.success("Item rejected.");
//             fetchData();
//           } else {
//             let errMsg = "Failed to reject";
//             try {
//               const error = await response.json();
//               errMsg = error.message || errMsg;
//             } catch { }
//             toast.error(`Error ${response.status}: ${errMsg}`);
//           }
//         } catch (error) {
//           console.error("Error rejecting:", error);
//           toast.error(error?.message || "Failed to reject item");
//         } finally {
//           setShowConfirmModal(false);
//           setConfirmAction(null);
//         }
//       }
//     });
//     setShowConfirmModal(true);
//   };

//   const Chip = ({ children, className = "" }) => (
//     <span
//       className={`w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-tight ${className}`}
//     >
//       {children}
//     </span>
//   );

//   const handleSelectRow = (id) => {
//     setSelectedRows((prev) =>
//       prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
//     );
//   };

//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedRows([]);
//     } else {
//       const ids = filteredData
//         .filter((row) => canApprove(row))
//         .map((row) => row.id);
//       setSelectedRows(ids);
//     }
//     setSelectAll(!selectAll);
//   };

//   const getApprovalStatus = (row) => {
//     const coorApproved = row.approval_coor === 1;
//     const spvApproved = row.approval_spv === 1;
//     const rejected = row.status === -1 || row.approval_coor === -1 || row.approval_spv === -1;

//     if (rejected) return <Chip className="bg-red-100 text-red-800">Rejected</Chip>;
//     if (coorApproved && spvApproved) return <Chip className="bg-green-100 text-green-800">Approved</Chip>;

//     if (coorApproved && !spvApproved) {
//       return (
//         <div className="flex flex-col gap-1">
//           <Chip className="bg-green-100 text-green-800">Coor ✓</Chip>
//           <Chip className="bg-yellow-100 text-yellow-800">Waiting SPV</Chip>
//         </div>
//       );
//     }

//     if (!coorApproved && spvApproved) {
//       return (
//         <div className="flex flex-col gap-1">
//           <Chip className="bg-blue-100 text-blue-800">SPV ✓</Chip>
//           <Chip className="bg-yellow-100 text-yellow-800">Waiting Coor</Chip>
//         </div>
//       );
//     }

//     return <Chip className="bg-gray-100 text-gray-800">Pending</Chip>;
//   };

//   const canApprove = (row) => {
//     if (userRole === "Prf") {
//       return row.status === 0;
//     }
//     if (userRole === "Mgr") {
//       return row.status === 0;
//     }
//     if (userRole === "Coor") {
//       return row.approval_coor === 0 && row.status === 0;
//     }
//     else if (userRole === "Spv") {
//       return row.approval_coor === 1 && row.approval_spv === 0 && row.status === 0;
//     }
//     return false;
//   };

//   const handleExport = () => {
//     const formattedData = filteredData.map((row) => ({
//       ID: row.id,
//       Date: formatDateTime(row.date),
//       "Process Order": row.processOrder,
//       Package: row.packageType,
//       Plant: row.plant,
//       Line: row.line,
//       Shift: row.shift,
//       Product: row.product,
//       Machine: row.machine,
//       "Coor Approval": row.approval_coor === 1 ? "Approved" : "Pending",
//       "SPV Approval": row.approval_spv === 1 ? "Approved" : "Pending",
//       Status: row.status === -1 ? "Rejected" : row.status === 0 ? "Pending" : "Approved",
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(formattedData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "CILT Approval");
//     XLSX.writeFile(workbook, "cilt_approval_export.xlsx");
//   };

//   return (
//     <MainLayout>
//       {/* Toast Container */}
//       <div className="fixed top-20 right-4 z-50 space-y-2">
//         {toasts.map(t => (
//           <div
//             key={t.id}
//             className={`px-6 py-4 rounded-lg shadow-lg animate-slide-in max-w-md ${t.type === 'success' ? 'bg-green-500 text-white' : t.type === 'error' ? 'bg-red-500 text-white' : t.type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
//               }`}
//           >
//             <p className="text-sm font-medium whitespace-pre-line">{t.message}</p>
//           </div>
//         ))}
//       </div>
//       <main className="flex-1 bg-white px-8 pt-16 pb-8">
//         <h1 className="text-black text-2xl text-center font-bold mb-6">
//           CILT Pro Approval
//         </h1>

//         {/* Confirmation Modal */}
//         <ConfirmModal
//           show={showConfirmModal}
//           onClose={() => {
//             setShowConfirmModal(false);
//             setConfirmAction(null);
//           }}
//           onConfirm={async (reason) => {
//             if (confirmAction) {
//               await confirmAction.execute(reason);
//               setShowConfirmModal(false);
//               setConfirmAction(null);
//             }
//           }}
//           item={confirmAction?.item}
//           type={confirmAction?.type}
//         />

//         {/* Detail Modal */}
//         <DetailModal
//           show={showDetailModal}
//           onClose={() => {
//             setShowDetailModal(false);
//             setSelectedItem(null);
//           }}
//           item={selectedItem}
//         />

//         {/* User Info */}
//         <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-700">
//                 <span className="font-bold">Logged in as:</span> {username || "Unknown"}
//               </p>
//               <p className="text-sm text-gray-700">
//                 <span className="font-bold">Role:</span> {userRole || "Unknown"}
//                 {userRole === "Prf" && (
//                   <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
//                     Admin - Full Access
//                   </span>
//                 )}
//                 {userRole === "Mgr" && (
//                   <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold">
//                     Manager - Full Access
//                   </span>
//                 )}
//                 {userRole === "Coor" && (
//                   <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
//                     Coordinator
//                   </span>
//                 )}
//                 {userRole === "Spv" && (
//                   <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
//                     Supervisor
//                   </span>
//                 )}
//               </p>
//             </div>
//             {userRole === "Prf" && (
//               <div className="text-xs text-gray-600 italic">
//                 You have full access to approve/reject all items
//               </div>
//             )}
//             {userRole === "Mgr" && (
//               <div className="text-xs text-gray-600 italic">
//                 You have full access to approve/reject all items
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="flex items-center gap-3 mb-6 flex-wrap">
//           <div className="relative flex items-center h-12 rounded-full focus-within:shadow-sm bg-gray-100 overflow-hidden">
//             <div className="grid place-items-center h-full w-12 text-gray-300 px-3">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                 />
//               </svg>
//             </div>
//             <input
//               className="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-gray-50 px-3"
//               type="text"
//               placeholder="Search anything..."
//               value={filterValue}
//               onChange={(e) => setFilterValue(e.target.value)}
//             />
//           </div>

//           <input
//             type="date"
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={filterDate}
//             onChange={(e) => setFilterDate(e.target.value)}
//           />

//           <select
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={selectedStatus}
//             onChange={(e) => setSelectedStatus(e.target.value)}
//           >
//             <option value="">All Status</option>
//             <option value="pending">All Pending</option>
//             <option value="approved">Fully Approved</option>
//             <option value="rejected">Rejected</option>
//           </select>

//           <select
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={selectedPlant}
//             onChange={(e) => setSelectedPlant(e.target.value)}
//           >
//             <option value="">All Plants</option>
//             {[...new Set(tableData.map((row) => row.plant))].map((plant) => (
//               <option key={plant} value={plant}>
//                 {plant}
//               </option>
//             ))}
//           </select>

//           <select
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={selectedLine}
//             onChange={(e) => setSelectedLine(e.target.value)}
//           >
//             <option value="">All Lines</option>
//             {[...new Set(tableData.map((row) => row.line))].map((line) => (
//               <option key={line} value={line}>
//                 {line}
//               </option>
//             ))}
//           </select>

//           <select
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={selectedShift}
//             onChange={(e) => setSelectedShift(e.target.value)}
//           >
//             <option value="">All Shifts</option>
//             {[...new Set(tableData.map((row) => row.shift))].map((s) => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>

//           <select
//             className="border border-gray-300 text-black rounded px-3 py-2"
//             value={selectedPackage}
//             onChange={(e) => setSelectedPackage(e.target.value)}
//           >
//             <option value="">All Packages</option>
//             {[...new Set(tableData.map((row) => row.packageType))].map((pkg) => (
//               <option key={pkg} value={pkg}>
//                 {pkg}
//               </option>
//             ))}
//           </select>

//           <button
//             className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 border border-blue-800 rounded"
//             onClick={handleExport}
//           >
//             Export to Excel
//           </button>
//         </div>

//         {selectedRows.length > 0 && (
//           <div className="flex items-center gap-3 mb-4 relative">
//             {/* Fullscreen Success Overlay */}
//             {showSuccess && (
//               <div className="fixed inset-0 bg-green-200/30 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-out">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-24 w-24 text-green-700 opacity-70"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={2}
//                   stroke="currentColor"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                 </svg>
//               </div>
//             )}

//             {/* Overlay Loading */}
//             {loading && (
//               <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[9998]">
//                 <div className="flex flex-col items-center">
//                   <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mb-2"></div>
//                   <p className="text-gray-800 font-semibold text-sm">Processing...</p>
//                 </div>
//               </div>
//             )}

//             {/* Approve Selected */}
//             <button
//               disabled={loading}
//               onClick={() => {
//                 const itemsToApprove = filteredData.filter((r) =>
//                   selectedRows.includes(r.id)
//                 );
//                 if (itemsToApprove.length === 0) return;

//                 setConfirmAction({
//                   type: "approve",
//                   item: {
//                     processOrder: `${itemsToApprove.length} selected items`,
//                     packageType: "Multiple Packages",
//                     plant: "-",
//                     line: "-",
//                     shift: "-",
//                     product: "-",
//                   },
//                   execute: async () => {
//                     setLoading(true);
//                     const role = userRole;

//                     await Promise.all(
//                       itemsToApprove.map(async (item) => {
//                         try {
//                           let endpoint = "";
//                           if (role === "Prf" || role === "Mgr") {
//                             if (item.approval_coor === 0) {
//                               endpoint = `http://10.24.0.81:3009/cilt/approve-coordinator/${item.id}`;
//                             } else if (item.approval_coor === 1 && item.approval_spv === 0) {
//                               endpoint = `http://10.24.0.81:3009/cilt/approve-supervisor/${item.id}`;
//                             } else return;
//                           } else if (role === "Coor") {
//                             endpoint = `http://10.24.0.81:3009/cilt/approve-coordinator/${item.id}`;
//                           } else if (role === "Spv") {
//                             endpoint = `http://10.24.0.81:3009/cilt/approve-supervisor/${item.id}`;
//                           } else {
//                             toast.error("Anda tidak punya izin untuk approve");
//                             return;
//                           }

//                           const response = await fetch(endpoint, {
//                             method: "PUT",
//                             headers: { "Content-Type": "application/json" },
//                             body: JSON.stringify({ username, role: roleId }),
//                           });

//                           if (!response.ok)
//                             console.warn(`⚠️ Gagal approve ID: ${item.id}`);
//                         } catch (err) {
//                           console.error(`❌ Error approving ID ${item.id}`, err);
//                         }
//                       })
//                     );

//                     toast.success(`Approved ${itemsToApprove.length} item(s) successfully.`);
//                     setShowSuccess(true);
//                     setTimeout(() => setShowSuccess(false), 1500);

//                     await fetchData();
//                     setSelectedRows([]);
//                     setSelectAll(false);
//                     setLoading(false);
//                   },
//                 });
//                 setShowConfirmModal(true);
//               }}
//               className={`${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700"
//                 } bg-green-600 text-white font-semibold py-2 px-4 rounded-lg`}
//             >
//               Approve Selected ({selectedRows.length})
//             </button>

//             {/* Reject Selected */}
//             <button
//               disabled={loading}
//               onClick={() => {
//                 const itemsToReject = filteredData.filter((r) =>
//                   selectedRows.includes(r.id)
//                 );
//                 if (itemsToReject.length === 0) return;

//                 setConfirmAction({
//                   type: "reject",
//                   item: {
//                     processOrder: `${itemsToReject.length} selected items`,
//                     packageType: "Multiple Packages",
//                     plant: "-",
//                     line: "-",
//                     shift: "-",
//                     product: "-",
//                   },
//                   execute: async (reason) => {
//                     if (!reason) {
//                       toast.warn("Alasan penolakan wajib diisi!");
//                       return;
//                     }

//                     setLoading(true);

//                     await Promise.all(
//                       itemsToReject.map(async (item) => {
//                         try {
//                           const response = await fetch(
//                             `http://10.24.0.81:3009/cilt/reject/${item.id}`,
//                             {
//                               method: "PUT",
//                               headers: { "Content-Type": "application/json" },
//                               body: JSON.stringify({ username, reason }),
//                             }
//                           );
//                           if (!response.ok)
//                             console.warn(`⚠️ Gagal reject ID: ${item.id}`);
//                         } catch (err) {
//                           console.error(`Error rejecting ID ${item.id}`, err);
//                         }
//                       })
//                     );

//                     toast.success(`Rejected ${itemsToReject.length} item(s) successfully.`);
//                     setShowSuccess(true);
//                     setTimeout(() => setShowSuccess(false), 1500);

//                     await fetchData();
//                     setSelectedRows([]);
//                     setSelectAll(false);
//                     setLoading(false);
//                   },
//                 });
//                 setShowConfirmModal(true);
//               }}
//               className={`${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-red-700"
//                 } bg-red-600 text-white font-semibold py-2 px-4 rounded-lg`}
//             >
//               Reject Selected ({selectedRows.length})
//             </button>

//             {/* Clear Selection */}
//             <button
//               disabled={loading}
//               onClick={() => {
//                 setSelectedRows([]);
//                 setSelectAll(false);
//               }}
//               className={`${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-400"
//                 } bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg`}
//             >
//               Clear Selection
//             </button>
//           </div>
//         )}

//         {/* Table */}
//         <div className="relative w-full rounded-xl bg-white shadow-xl">
//           {!loading && tableData.length === 0 && (
//             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
//               <p className="text-sm font-bold text-yellow-800">⚠️ Debug Info:</p>
//               <p className="text-xs text-yellow-700">No data loaded from API. Check:</p>
//               <ul className="text-xs text-yellow-700 list-disc ml-5">
//                 <li>API endpoint: <code>http://10.24.0.81:3009/cilt</code></li>
//                 <li>Browser Console (F12) for errors</li>
//                 <li>Network tab to see API response</li>
//               </ul>
//             </div>
//           )}

//           <div className="relative w-full overflow-y-auto flex flex-col px-5 py-4" style={{ maxHeight: "750px" }}>
//             <table className="w-full text-sm text-left text-gray-500">
//               <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
//                 <tr>
//                   <th className="py-3 px-4 text-center">
//                     <input
//                       type="checkbox"
//                       checked={selectAll}
//                       onChange={handleSelectAll}
//                       className="w-4 h-4 text-green-600 border-gray-300 rounded"
//                     />
//                   </th>
//                   <th scope="col" className="py-3 px-6">ID</th>
//                   <th scope="col" className="py-3 px-6">Date</th>
//                   <th scope="col" className="py-3 px-6">Process Order</th>
//                   <th scope="col" className="py-3 px-6">Package</th>
//                   <th scope="col" className="py-3 px-6">Plant</th>
//                   <th scope="col" className="py-3 px-6">Line</th>
//                   <th scope="col" className="py-3 px-6">Shift</th>
//                   <th scope="col" className="py-3 px-6">Product</th>
//                   <th scope="col" className="py-3 px-6">Machine</th>
//                   <th scope="col" className="py-3 px-6 w-44 min-w-[11rem]">Approval Status</th>
//                   <th scope="col" className="py-3 px-6">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan="11" className="text-center py-4">Loading...</td>
//                   </tr>
//                 ) : filteredData.length > 0 ? (
//                   filteredData.map((row) => (
//                     <tr className="bg-white border-b hover:bg-gray-50" key={row.id}>
//                       <td className="py-4 px-4 text-center">
//                         {canApprove(row) ? (
//                           <input
//                             type="checkbox"
//                             checked={selectedRows.includes(row.id)}
//                             onChange={() => handleSelectRow(row.id)}
//                             className="w-4 h-4 text-green-600 border-gray-300 rounded"
//                           />
//                         ) : (
//                           <input type="checkbox" disabled className="w-4 h-4 text-gray-300" />
//                         )}
//                       </td>
//                       <td className="py-4 px-6">{row.id}</td>
//                       <td className="py-4 px-6">{formatDateTime(row.date)}</td>
//                       <td className="py-4 px-6 font-medium">{row.processOrder}</td>
//                       <td className="py-4 px-6">{row.packageType}</td>
//                       <td className="py-4 px-6">{row.plant}</td>
//                       <td className="py-4 px-6 whitespace-nowrap">{row.line}</td>
//                       <td className="py-4 px-6 whitespace-nowrap">{row.shift}</td>
//                       <td className="py-4 px-6">{row.product}</td>
//                       <td className="py-4 px-6">{row.machine}</td>
//                       <td className="py-4 px-6">{getApprovalStatus(row)}</td>
//                       <td className="py-4 px-6">
//                         <div className="flex gap-2 items-center">
//                           <button
//                             onClick={() => handleViewDetail(row)}
//                             className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
//                             title="View Details"
//                           >
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                             </svg>
//                           </button>
//                           {canApprove(row) && (
//                             <>
//                               <button
//                                 onClick={() => handleApprove(row)}
//                                 className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs"
//                               >
//                                 Approve
//                               </button>
//                               <button
//                                 onClick={() => handleReject(row)}
//                                 className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs"
//                               >
//                                 Reject
//                               </button>
//                             </>
//                           )}
//                           {!canApprove(row) && (
//                             <>
//                               {row.approval_coor === 1 && row.approval_spv === 1 ? (
//                                 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
//                                   <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
//                                     <path
//                                       fillRule="evenodd"
//                                       d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                                       clipRule="evenodd"
//                                     />
//                                   </svg>
//                                   <span className="text-xs font-semibold text-green-700">Fully Approved</span>
//                                 </div>
//                               ) : (
//                                 <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg min-w-[110px] whitespace-nowrap">
//                                   <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                                     <path
//                                       fillRule="evenodd"
//                                       d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                                       clipRule="evenodd"
//                                     />
//                                   </svg>
//                                   <span className="text-xs font-semibold text-gray-600 tracking-wide">No Action</span>
//                                 </div>
//                               )}
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="11" className="text-center py-4">No data available</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Summary */}
//         <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//           <p className="text-sm text-gray-700">
//             <span className="font-bold">Total Records:</span> {filteredData.length}
//             {selectedStatus === "pending" && (
//               <span className="ml-4 text-orange-600 font-bold">
//                 Items you can approve: {filteredData.filter(row => canApprove(row)).length}
//               </span>
//             )}
//           </p>
//         </div>
//       </main>

//       {/* CSS untuk animasi modal */}
//       <style jsx global>{`
//           /* Modal Animation */
//           @keyframes scale-in {
//             from {
//               opacity: 0;
//               transform: scale(0.9);
//             }
//             to {
//               opacity: 1;
//               transform: scale(1);
//             }
//           }
          
//           .animate-scale-in {
//             animation: scale-in 0.2s ease-out;
//           }
//           @keyframes fade-out {
//             0% { opacity: 1; }
//             100% { opacity: 0; }
//           }
//           .animate-fade-out {
//             animation: fade-out 1.5s ease-out forwards;
//           }
//           @keyframes fadeSlideIn {
//             from {
//               opacity: 0;
//               transform: translateY(15px);
//             }
//             to {
//               opacity: 1;
//               transform: translateY(0);
//             }
//           }
//           .animate-fadeSlideIn {
//             animation: fadeSlideIn 0.6s ease-out;
//           }
//           /* Toast Animation */
//           @keyframes slide-in {
//             from {
//               opacity: 0;
//               transform: translateX(100%);
//             }
//             to {
//               opacity: 1;
//               transform: translateX(0);
//             }
//           }
//         `}</style>
//     </MainLayout>
//   );
// };

// export default CILTApproval;