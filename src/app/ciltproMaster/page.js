/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
// import { Notyf } from "notyf";
// import "notyf/notyf.min.css";
import MainLayout from "../mainLayout";
import { Copy, Trash2, Save, X, Database, GitBranch, Package, Edit, Eye, EyeOff, ChevronDown, ChevronUp, RefreshCw, Plus, Settings, Factory, Cpu, Box, Table, Columns, Grid, Type } from "lucide-react";

const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isLocked]);
};

// Package Designer Modal Component
const PackageDesignerModal = React.memo(({ show, onClose, onSave, packageData, isLoading }) => {
    useBodyScrollLock(show);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [initialLoading, setInitialLoading] = useState(false);

    // Fetch package design data when modal opens
    useEffect(() => {
        const fetchPackageDesign = async () => {
            if (show && packageData?.id) {
                console.log("🔄 Fetching package design for ID:", packageData.id);
                setInitialLoading(true);

                try {
                    const response = await fetch(`http://10.24.0.81:3009/custom/packages/packages/${packageData.id}`);
                    console.log("📦 API Response status:", response.status);

                    if (!response.ok) {
                        console.error("❌ Failed to fetch package design");
                        setColumns([]);
                        setRows([]);
                        return;
                    }

                    const data = await response.json();
                    console.log("📦 Package design data:", data);

                    const pkg = data?.data || null;
                    console.log("📦 Parsed package object:", pkg);

                    if (!pkg) {
                        console.log("📦 No package design data found, using defaults");
                        setColumns([]);
                        setRows([]);
                    } else if (!pkg.header || !pkg.item) {
                        console.log("📦 No package design data found, using defaults");
                        setColumns([]);
                        setRows([]);
                    } else {
                        try {
                            const headerData = pkg.header ? JSON.parse(pkg.header) : {};
                            console.log("📦 Header data:", headerData);

                            setColumns(Array.isArray(headerData.columns) ? headerData.columns : []);

                            const itemData = pkg.item ? JSON.parse(pkg.item) : [];
                            console.log("📦 Item data:", itemData);

                            setRows(Array.isArray(itemData) ? itemData : []);
                        } catch (err) {
                            console.error("❌ Error parsing package design JSON:", err);
                            setColumns([]);
                            setRows([]);
                        }
                    }
                } catch (error) {
                    console.error("❌ Error fetching package design:", error);
                    setColumns([]);
                    setRows([]);
                } finally {
                    setInitialLoading(false);
                }
            }
        };

        fetchPackageDesign();
    }, [show, packageData?.id]);

    // Reset state when modal closes
    useEffect(() => {
        if (!show) {
            setColumns([]);
            setRows([]);
            setInitialLoading(false);
        }
    }, [show]);

    const addColumn = () => {
        const newColumn = {
            id: `col_${Date.now()}`,
            name: `Column ${columns.length + 1}`,
            type: 'text',
            required: false,
            options: []
        };
        setColumns([...columns, newColumn]);
    };

    const updateColumn = (id, field, value) => {
        setColumns(columns.map(col =>
            col.id === id ? { ...col, [field]: value } : col
        ));
    };

    const deleteColumn = (id) => {
        setColumns(columns.filter(col => col.id !== id));
        if (Array.isArray(rows)) {
            setRows(rows.map(row => {
                const newRow = { ...row };
                delete newRow[id];
                return newRow;
            }));
        } else {
            setRows([]);
        }
    };

    const addRow = () => {
        const newRow = { id: `row_${Date.now()}` };
        columns.forEach(col => {
            newRow[col.id] = '';
        });
        setRows(prevRows => [...(Array.isArray(prevRows) ? prevRows : []), newRow]);
    };

    const updateRow = (rowId, columnId, value) => {
        if (Array.isArray(rows)) {
            setRows(rows.map(row =>
                row.id === rowId ? { ...row, [columnId]: value } : row
            ));
        }
    };

    const deleteRow = (rowId) => {
        if (Array.isArray(rows)) {
            setRows(rows.filter(row => row.id !== rowId));
        } else {
            setRows([]);
        }
    };

    const handleSave = () => {
        if (columns.length === 0) {
            alert("Please add at least one column!");
            return;
        }

        const saveData = {
            plant: packageData.plant,
            machine: packageData.machine,
            line: packageData.line,
            package: packageData.package,
            header: JSON.stringify({
                description: packageData.description || '',
                columns: columns
            }),
            item: JSON.stringify(Array.isArray(rows) ? rows : [])
        };

        console.log("💾 Saving package design:", saveData);
        onSave(saveData);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-full">
                                <Grid className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Package Designer</h3>
                                <p className="text-white/90 text-sm">
                                    {packageData?.package} - {packageData?.line}
                                    {initialLoading && " (Loading...)"}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                            <p className="text-gray-600">Loading package design...</p>
                        </div>
                    ) : (
                        <>
                            {/* Column Designer Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Columns className="w-5 h-5 text-purple-600" />
                                        <h4 className="text-lg font-bold text-gray-800">Column Configuration</h4>
                                        <span className="text-sm text-gray-600">({Array.isArray(columns) ? columns.length : 0} columns)</span>
                                    </div>
                                    <button
                                        onClick={addColumn}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Column
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {Array.isArray(columns) && columns.map((col, idx) => (
                                        <div key={col.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                                            <div className="grid grid-cols-12 gap-3 items-center">
                                                <div className="col-span-1 text-center">
                                                    <span className="text-sm font-bold text-gray-600">#{idx + 1}</span>
                                                </div>

                                                <div className="col-span-4">
                                                    <input
                                                        type="text"
                                                        value={col.name}
                                                        onChange={(e) => updateColumn(col.id, 'name', e.target.value)}
                                                        placeholder="Column Name"
                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-black bg-white"
                                                    />
                                                </div>

                                                <div className="col-span-3">
                                                    <select
                                                        value={col.type}
                                                        onChange={(e) => updateColumn(col.id, 'type', e.target.value)}
                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-black bg-white"
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="date">Date</option>
                                                        <option value="dropdown">Dropdown</option>
                                                        <option value="checkbox">Checkbox</option>
                                                        <option value="textarea">Textarea</option>
                                                    </select>
                                                </div>

                                                <div className="col-span-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={col.required}
                                                            onChange={(e) => updateColumn(col.id, 'required', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm text-gray-700">Required</span>
                                                    </label>
                                                </div>

                                                <div className="col-span-2 flex justify-end">
                                                    <button
                                                        onClick={() => deleteColumn(col.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {col.type === 'dropdown' && (
                                                <div className="mt-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Options (comma-separated: Option1, Option2, Option3)"
                                                        value={col.options?.join(', ') || ''}
                                                        onChange={(e) => updateColumn(col.id, 'options', e.target.value.split(',').map(o => o.trim()))}
                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-black bg-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!Array.isArray(columns) || columns.length === 0) && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Columns className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No columns yet. Click "Add Column" to start.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data Rows Section */}
                            {Array.isArray(columns) && columns.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Table className="w-5 h-5 text-indigo-600" />
                                            <h4 className="text-lg font-bold text-gray-800">Data Rows</h4>
                                            <span className="text-sm text-gray-600">({Array.isArray(rows) ? rows.length : 0} rows)</span>
                                        </div>
                                        <button
                                            onClick={addRow}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Row
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="py-3 px-3 text-left font-bold text-gray-700">#</th>
                                                    {Array.isArray(columns) && columns.map(col => (
                                                        <th key={col.id} className="py-3 px-3 text-left font-bold text-gray-700">
                                                            {col.name}
                                                            {col.required && <span className="text-red-500 ml-1">*</span>}
                                                        </th>
                                                    ))}
                                                    <th className="py-3 px-3 text-left font-bold text-gray-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {Array.isArray(rows) && rows.map((row, idx) => (
                                                    <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="py-2 px-3 text-gray-600 font-medium">{idx + 1}</td>
                                                        {Array.isArray(columns) && columns.map(col => (
                                                            <td key={col.id} className="py-2 px-3">
                                                                {col.type === 'textarea' ? (
                                                                    <textarea
                                                                        value={row[col.id] || ''}
                                                                        onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                                                                        rows="2"
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-black bg-white"
                                                                    />
                                                                ) : col.type === 'dropdown' ? (
                                                                    <select
                                                                        value={row[col.id] || ''}
                                                                        onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-black bg-white"
                                                                    >
                                                                        <option value="">-- Select --</option>
                                                                        {Array.isArray(col.options) && col.options.map(opt => (
                                                                            <option key={opt} value={opt}>{opt}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : col.type === 'checkbox' ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={row[col.id] === true || row[col.id] === 'true'}
                                                                        onChange={(e) => updateRow(row.id, col.id, e.target.checked)}
                                                                        className="w-4 h-4"
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type={col.type}
                                                                        value={row[col.id] || ''}
                                                                        onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-black bg-white"
                                                                    />
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="py-2 px-3">
                                                            <button
                                                                onClick={() => deleteRow(row.id)}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {(!Array.isArray(rows) || rows.length === 0) && (
                                                    <tr>
                                                        <td colSpan={(Array.isArray(columns) ? columns.length : 0) + 2} className="py-8 text-center text-gray-500">
                                                            <Table className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                            <p className="text-sm">No data rows yet. Click "Add Row" to start.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end flex-shrink-0 border-t-2 border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || initialLoading}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {isLoading ? "Saving..." : "Save Package"}
                    </button>
                </div>
            </div>
        </div>
    );
});

PackageDesignerModal.displayName = 'PackageDesignerModal';

// Edit Modal Component
const EditModal = React.memo(({ show, onClose, onSave, item, onItemChange, isLoading }) => {
    useBodyScrollLock(show);
    if (!show || !item) return null;

    const isGnr = item.editType === 'gnr';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-full">
                                <Edit className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Edit {isGnr ? 'GNR' : 'Checklist CILT'}
                                </h3>
                                <p className="text-white/90 text-sm mt-0.5">
                                    {item.package} - {item.line}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
                    {isGnr ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Activity</label>
                                <input
                                    type="text"
                                    value={item.activity || ''}
                                    onChange={(e) => onItemChange({ ...item, activity: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Frekuensi</label>
                                <input
                                    type="text"
                                    value={item.frekuensi || ''}
                                    onChange={(e) => onItemChange({ ...item, frekuensi: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Good</label>
                                <textarea
                                    value={item.good || ''}
                                    onChange={(e) => onItemChange({ ...item, good: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Need</label>
                                <textarea
                                    value={item.need || ''}
                                    onChange={(e) => onItemChange({ ...item, need: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reject</label>
                                <textarea
                                    value={item.reject || ''}
                                    onChange={(e) => onItemChange({ ...item, reject: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                                <input
                                    type="text"
                                    value={item.job_type || ''}
                                    onChange={(e) => onItemChange({ ...item, job_type: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Component</label>
                                <input
                                    type="text"
                                    value={item.componen || ''}
                                    onChange={(e) => onItemChange({ ...item, componen: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Standart</label>
                                <textarea
                                    value={item.standart || ''}
                                    onChange={(e) => onItemChange({ ...item, standart: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
});

EditModal.displayName = 'EditModal';

// Add Record Modal Component
const AddRecordModal = React.memo(({ show, onClose, onSave, recordType, record, onRecordChange, isLoading }) => {
    useBodyScrollLock(show);
    if (!show || !recordType) return null;

    const isGnr = recordType === 'gnr';
    const frekuensiOptions = ['Tiap Jam', 'Tiap 30 Menit', 'Tiap 15 Menit', 'Tiap 45 Menit', 'Custom'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-full">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Add New {isGnr ? 'GNR' : 'Checklist CILT'} Record
                                </h3>
                                <p className="text-white/90 text-sm mt-0.5">
                                    {record.package_type} - {record.line}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
                    {isGnr ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Activity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.activity || ''}
                                    onChange={(e) => onRecordChange({ ...record, activity: e.target.value })}
                                    placeholder="Masukkan activity..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Frekuensi <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={(e) => { e.preventDefault(); onRecordChange({ ...record, _frekuensiMode: 'dropdown' }); }}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${(record._frekuensiMode || 'dropdown') === 'dropdown'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        type="button"
                                    >
                                        Pilih dari List
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); onRecordChange({ ...record, _frekuensiMode: 'custom' }); }}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${record._frekuensiMode === 'custom'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        type="button"
                                    >
                                        Input Manual
                                    </button>
                                </div>

                                {(record._frekuensiMode || 'dropdown') === 'dropdown' ? (
                                    <select
                                        value={record.frekuensi || 'Tiap Jam'}
                                        onChange={(e) => {
                                            if (e.target.value === 'Custom') {
                                                onRecordChange({ ...record, _frekuensiMode: 'custom', frekuensi: '' });
                                            } else {
                                                onRecordChange({ ...record, frekuensi: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                    >
                                        {frekuensiOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={record._customFrekuensi || record.frekuensi || ''}
                                        onChange={(e) => {
                                            onRecordChange({ ...record, _customFrekuensi: e.target.value, frekuensi: e.target.value });
                                        }}
                                        placeholder="Contoh: Tiap 2 Jam, Setiap 10 Menit, dll..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    value={record.status || 1}
                                    onChange={(e) => onRecordChange({ ...record, status: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Good <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={record.good || ''}
                                    onChange={(e) => onRecordChange({ ...record, good: e.target.value })}
                                    rows="2"
                                    placeholder="Kriteria Good..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Need</label>
                                <textarea
                                    value={record.need || ''}
                                    onChange={(e) => onRecordChange({ ...record, need: e.target.value })}
                                    rows="2"
                                    placeholder="Kriteria Need (optional)..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reject</label>
                                <textarea
                                    value={record.reject || ''}
                                    onChange={(e) => onRecordChange({ ...record, reject: e.target.value })}
                                    rows="2"
                                    placeholder="Kriteria Reject (optional)..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job Type <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.job_type || ''}
                                    onChange={(e) => onRecordChange({ ...record, job_type: e.target.value })}
                                    placeholder="Contoh: Bersihkan dan periksa"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Component <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={record.componen || ''}
                                    onChange={(e) => onRecordChange({ ...record, componen: e.target.value })}
                                    placeholder="Contoh: Carton Magazine"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Standart <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={record.standart || ''}
                                    onChange={(e) => onRecordChange({ ...record, standart: e.target.value })}
                                    rows="3"
                                    placeholder="Deskripsi standart yang harus dipenuhi..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">PIC</label>
                                <input
                                    type="text"
                                    value={record.pic || 'operator'}
                                    onChange={(e) => onRecordChange({ ...record, pic: e.target.value })}
                                    placeholder="PIC yang bertanggung jawab"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Info:</strong> Data akan langsung tersimpan ke database setelah diklik Create Record
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Database className="w-5 h-5" />
                        {isLoading ? "Creating..." : "Create Record"}
                    </button>
                </div>
            </div>
        </div>
    );
});

AddRecordModal.displayName = 'AddRecordModal';

// CustomizationModal Component
const CustomizationModal = React.memo(
    ({
        show,
        onClose,
        customType,
        onSave,
        isLoading,
        availablePlants = [],
        availableMachines = [],
        availableLines = [],
        editMode = false,
        editData = null
    }) => {
        useBodyScrollLock(show);
        const [formData, setFormData] = React.useState({
            plant: "",
            machine: "",
            line: "",
            package: "",
            description: "",
            inputMode: {
                plant: "dropdown",
                machine: "dropdown"
            }
        });

        // Load data when editing
        React.useEffect(() => {
            if (!show) {
                setFormData({
                    plant: "",
                    machine: "",
                    line: "",
                    package: "",
                    description: "",
                    inputMode: { plant: "dropdown", machine: "dropdown" }
                });
            } else if (editMode && editData) {
                setFormData({
                    plant: editData.plant || "",
                    machine: editData.machine || "",
                    line: editData.line || "",
                    package: editData.name || editData.package || "",
                    description: editData.description || "",
                    inputMode: { plant: "dropdown", machine: "dropdown" }
                });
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [show, editMode, editData]);

        if (!show || !customType) return null;

        // UI ICON
        const getIcon = () => {
            switch (customType) {
                case "plant":
                    return <Factory className="w-6 h-6 text-white" />;
                case "machine":
                    return <Cpu className="w-6 h-6 text-white" />;
                case "package":
                    return <Box className="w-6 h-6 text-white" />;
                default:
                    return <Settings className="w-6 h-6 text-white" />;
            }
        };

        // TITLE
        const getTitle = () => {
            const prefix = editMode ? "Edit" : "Add New";
            switch (customType) {
                case "plant":
                    return `${prefix} Plant`;
                case "machine":
                    return `${prefix} Machine`;
                case "package":
                    return `${prefix} Package Type`;
                default:
                    return `${prefix} Item`;
            }
        };

        // SUBMIT HANDLER
        const handleSubmit = () => {
            const value =
                customType === "plant"
                    ? formData.plant
                    : customType === "machine"
                        ? formData.machine
                        : formData.package;

            if (!value.trim()) {
                alert(`${customType.charAt(0).toUpperCase() + customType.slice(1)} name is required!`);
                return;
            }

            if (customType === "package") {
                if (
                    !formData.plant.trim() ||
                    !formData.machine.trim() ||
                    !formData.line.trim()
                ) {
                    alert("Plant, Machine, and Line are required for package!");
                    return;
                }
            }

            const saveData = {
                type: customType,
                value: value.trim(),
                description: formData.description.trim(),
                ...(customType === "package" && {
                    plant: formData.plant.trim(),
                    machine: formData.machine.trim(),
                    line: formData.line.trim(),
                    isNewPlant: formData.inputMode.plant === "custom",
                    isNewMachine: formData.inputMode.machine === "custom"
                })
            };
            onSave(editMode ? { ...saveData, id: editData.id } : saveData);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-in">
                    {/* HEADER */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-full">{getIcon()}</div>
                            <div>
                                <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
                                <p className="text-white/80 text-sm">
                                    {editMode ? 'Update' : 'Add custom'} {customType} to the system
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="px-6 py-6 max-h-[600px] overflow-y-auto">
                        <div className="space-y-4">
                            {customType === "package" && (
                                <>
                                    {/* PLANT Hybrid input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Plant <span className="text-red-500">*</span>
                                        </label>

                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        inputMode: { ...formData.inputMode, plant: "dropdown" }
                                                    })
                                                }
                                                className={`px-3 py-1.5 rounded font-medium text-sm ${formData.inputMode.plant === "dropdown"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                Select
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        inputMode: { ...formData.inputMode, plant: "custom" }
                                                    })
                                                }
                                                className={`px-3 py-1.5 rounded font-medium text-sm ${formData.inputMode.plant === "custom"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                Custom
                                            </button>
                                        </div>

                                        {formData.inputMode.plant === "dropdown" ? (
                                            <select
                                                value={formData.plant}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, plant: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                            >
                                                <option value="">-- Select Plant --</option>
                                                {availablePlants.map((p) => (
                                                    <option key={p.id} value={p.name}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.plant}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, plant: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                                placeholder="Type plant name..."
                                            />
                                        )}
                                    </div>

                                    {/* MACHINE hybrid input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Machine <span className="text-red-500">*</span>
                                        </label>

                                        <div className="flex gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        inputMode: { ...formData.inputMode, machine: "dropdown" }
                                                    })
                                                }
                                                className={`px-3 py-1.5 rounded font-medium text-sm ${formData.inputMode.machine === "dropdown"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                Select
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        inputMode: { ...formData.inputMode, machine: "custom" }
                                                    })
                                                }
                                                className={`px-3 py-1.5 rounded font-medium text-sm ${formData.inputMode.machine === "custom"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                Custom
                                            </button>
                                        </div>

                                        {formData.inputMode.machine === "dropdown" ? (
                                            <select
                                                value={formData.machine}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, machine: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                            >
                                                <option value="">-- Select Machine --</option>
                                                {availableMachines.map((m) => (
                                                    <option key={m.id} value={m.name}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formData.machine}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, machine: e.target.value })
                                                }
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                                placeholder="Type machine name..."
                                            />
                                        )}
                                    </div>

                                    {/* LINE SELECT */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Line <span className="text-red-500">*</span>
                                        </label>

                                        <select
                                            value={formData.line}
                                            onChange={(e) =>
                                                setFormData({ ...formData, line: e.target.value })
                                            }
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                        >
                                            <option value="">-- Select Line --</option>
                                            {availableLines.map((line) => (
                                                <option key={line} value={line}>
                                                    {line}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* NAME FIELD */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {customType.charAt(0).toUpperCase() + customType.slice(1)}{" "}
                                    Name <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={
                                        customType === "plant"
                                            ? formData.plant
                                            : customType === "machine"
                                                ? formData.machine
                                                : formData.package
                                    }
                                    onChange={(e) => {
                                        const key =
                                            customType === "plant"
                                                ? "plant"
                                                : customType === "machine"
                                                    ? "machine"
                                                    : "package";

                                        setFormData({ ...formData, [key]: e.target.value });
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            {/* DESCRIPTION FIELD */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description (Optional)
                                </label>

                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black bg-white"
                                />
                            </div>

                            {/* INFO BANNER */}
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm text-purple-800">
                                    <strong>ℹ️ Info:</strong>{" "}
                                    {editMode ? "Update" : "Create"} custom {customType}.
                                </p>
                                {customType === "package" && formData.inputMode.plant === "custom" && (
                                    <p className="text-xs text-purple-700 mt-1">
                                        ⚡ Custom plant will be created automatically.
                                    </p>
                                )}
                                {customType === "package" &&
                                    formData.inputMode.machine === "custom" && (
                                        <p className="text-xs text-purple-700 mt-1">
                                            ⚡ Custom machine will be created automatically.
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {isLoading ? (editMode ? "Updating..." : "Creating...") : editMode ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
);

CustomizationModal.displayName = "CustomizationModal";

// Confirmation Modal Component
const ConfirmModal = React.memo(({ show, onClose, onConfirm, action, newLineName, selectedReferenceLine, selectedPackages }) => {
    useBodyScrollLock(show);
    if (!show || !action) return null;

    const isDelete = action.type === "delete";
    const isDeleteDetail = action.type === "deleteDetail";
    const isDeleteCustom = action.type === "deleteCustom";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
                <div className={`${isDelete || isDeleteDetail || isDeleteCustom ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-emerald-600 to-emerald-700'} px-6 py-4`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            {isDelete || isDeleteDetail || isDeleteCustom ? (
                                <Trash2 className="w-6 h-6 text-white" />
                            ) : (
                                <Save className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {isDelete
                                    ? 'Confirm Line Deletion'
                                    : isDeleteDetail
                                        ? 'Confirm Record Deletion'
                                        : isDeleteCustom
                                            ? 'Confirm Deletion'
                                            : 'Confirm Creation'}
                            </h3>
                            <p className="text-white/90 text-sm mt-0.5">
                                {isDelete || isDeleteDetail || isDeleteCustom
                                    ? 'This action cannot be undone'
                                    : 'Create new line with selected packages'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="space-y-3 mb-5">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2.5">
                            {isDelete ? (
                                <>
                                    <p className="text-gray-700 font-semibold">Delete Line: <span className="text-red-600">{action.lineName}</span></p>
                                    <p className="text-sm text-gray-600">All packages, GNR, and checklist data for this line will be permanently removed.</p>
                                </>
                            ) : isDeleteDetail ? (
                                <>
                                    <p className="text-gray-700 font-semibold">
                                        Delete {action.isGnr ? 'GNR' : 'Checklist'} Record
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-start">
                                            <span className="text-gray-500 w-24">ID:</span>
                                            <span className="text-gray-900 font-semibold">{action.detail?.id}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="text-gray-500 w-24">Package:</span>
                                            <span className="text-gray-900 font-medium">{action.packageName || '-'}</span>
                                        </div>
                                        {action.isGnr ? (
                                            <div className="flex items-start">
                                                <span className="text-gray-500 w-24">Activity:</span>
                                                <span className="text-gray-900 font-medium">{action.detail?.activity}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-start">
                                                <span className="text-gray-500 w-24">Component:</span>
                                                <span className="text-gray-900 font-medium">{action.detail?.componen}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm text-red-800">
                                            ⚠️ This will permanently delete this record from the database.
                                        </p>
                                    </div>
                                </>
                            ) : isDeleteCustom ? (
                                <>
                                    <p className="text-gray-700 font-semibold">
                                        Delete {action.customType}:
                                        <span className="text-red-600"> {action.name}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        This custom item will be permanently removed.
                                    </p>
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm text-red-800">
                                            ⚠️ This action cannot be undone.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start">
                                        <span className="text-gray-500 text-sm w-32">New Line:</span>
                                        <span className="text-gray-900 font-semibold text-sm">{newLineName}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-gray-500 text-sm w-32">Copy From:</span>
                                        <span className="text-gray-900 font-medium text-sm">{selectedReferenceLine}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-gray-500 text-sm w-32">Packages:</span>
                                        <span className="text-gray-900 font-medium text-sm">
                                            {Object.values(selectedPackages).filter(Boolean).length} selected
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${isDelete || isDeleteDetail || isDeleteCustom
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                        >
                            {isDelete || isDeleteDetail || isDeleteCustom
                                ? 'Yes, Delete'
                                : 'Yes, Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

ConfirmModal.displayName = 'ConfirmModal';

const CILTProMaster = () => {
    const [allPackages, setAllPackages] = useState([]);
    const [uniqueLines, setUniqueLines] = useState([]);
    const [selectedReferenceLine, setSelectedReferenceLine] = useState("");
    const [newLineName, setNewLineName] = useState("");
    const [referencePackages, setReferencePackages] = useState([]);
    const [selectedPackages, setSelectedPackages] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingCustomItems, setLoadingCustomItems] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [expandedLines, setExpandedLines] = useState([]);
    const [linePackagesMap, setLinePackagesMap] = useState({});
    const [toasts, setToasts] = useState([]);

    // states for package details
    const [expandedPackage, setExpandedPackage] = useState(null);
    const [packageDetails, setPackageDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // states for Add New Record
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingRecordType, setAddingRecordType] = useState(null);
    const [newRecord, setNewRecord] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // states for Package Designer
    const [showPackageDesigner, setShowPackageDesigner] = useState(false);
    const [designingPackage, setDesigningPackage] = useState(null);

    // states for Customization
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customizationType, setCustomizationType] = useState(null);
    const [customItems, setCustomItems] = useState({
        plants: [],
        machines: [],
        packages: []
    });

    // states for add Line from package master 
    const [availableLines, setAvailableLines] = useState([]);
    const [editCustomModal, setEditCustomModal] = useState({
        show: false,
        type: null,
        item: null
    });

    // Toast System
    const addToast = (message, type = "info") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const toast = {
        success: (m) => addToast(m, "success"),
        error: (m) => addToast(m, "error"),
        info: (m) => addToast(m, "info"),
        warn: (m) => addToast(m, "warning"),
    };

    useEffect(() => {
        fetchAllPackages();
        fetchCustomItems();
        fetchAvailableLines();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAllPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://10.24.0.81:3009/package-master");
            if (response.ok) {
                const data = await response.json();
                console.log("Fetching all packages from line-master", data);

                setAllPackages(data || []);

                const lines = [...new Set((data || []).map(item => item.line))]
                    .filter(Boolean)
                    .sort();
                setUniqueLines(lines);

                toast.success(`Loaded ${(data || []).length} packages from ${lines.length} lines`);
            } else {
                toast.error("Failed to fetch package master data");
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
            toast.error("Error loading data. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // fetchCustomItems
    const fetchCustomItems = async () => {
        try {
            setLoadingCustomItems(true);

            // Plants
            const plantsRes = await fetch("http://10.24.0.81:3009/custom/plants");
            const plantsData = plantsRes.ok ? await plantsRes.json() : { data: [] };
            const plants = Array.isArray(plantsData.data)
                ? plantsData.data.map(p => ({
                    id: p.id,
                    name: p.plant,
                    description: p.description || ""
                }))
                : [];

            // Machines
            const machinesRes = await fetch("http://10.24.0.81:3009/custom/machines");
            const machinesData = machinesRes.ok ? await machinesRes.json() : { data: [] };
            const machines = Array.isArray(machinesData.data)
                ? machinesData.data.map(m => ({
                    id: m.id,
                    name: m.machine,
                    description: m.description || ""
                }))
                : [];

            // Packages
            const packagesRes = await fetch("http://10.24.0.81:3009/custom/packages");
            const packagesData = packagesRes.ok ? await packagesRes.json() : { data: [] };
            const packages = Array.isArray(packagesData.data)
                ? packagesData.data.map(pkg => ({
                    id: pkg.id,
                    name: pkg.package,
                    plant: pkg.plant,
                    machine: pkg.machine,
                    line: pkg.line,
                    header: pkg.header,
                    item: pkg.item,
                    description: (() => {
                        try {
                            const h = pkg.header ? JSON.parse(pkg.header) : {};
                            return h.description || h.title || "";
                        } catch {
                            return "";
                        }
                    })()
                }))
                : [];

            setCustomItems({ plants, machines, packages });
            toast.success("⚡ Custom items loaded successfully");
        } catch (err) {
            console.error("Error loading custom items:", err);
            toast.error("Failed to load custom items");
        } finally {
            setLoadingCustomItems(false);
        }
    };

    // FETCH AVAILABLE LINES
    const fetchAvailableLines = async () => {
        try {
            const response = await fetch("http://10.24.0.81:3009/package-master");
            if (response.ok) {
                const data = await response.json();
                const lines = [...new Set((data || []).map(i => i.line))]
                    .filter(Boolean)
                    .sort();
                setAvailableLines(lines);
            }
        } catch (err) {
            console.error("Error fetching lines:", err);
        }
    };

    useEffect(() => {
        if (selectedReferenceLine) {
            const filtered = allPackages.filter(pkg => pkg.line === selectedReferenceLine);
            setReferencePackages(filtered);

            const autoSelect = {};
            filtered.forEach(pkg => {
                autoSelect[pkg.id] = true;
            });
            setSelectedPackages(autoSelect);

            toast.info(`Found ${filtered.length} packages in ${selectedReferenceLine}`);
        } else {
            setReferencePackages([]);
            setSelectedPackages({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReferenceLine, allPackages]);

    // Fetch package details (GNR or Checklist data)
    const fetchPackageDetails = async (pkg) => {
        if (expandedPackage?.id === pkg.id) {
            setExpandedPackage(null);
            setPackageDetails([]);
            return;
        }
        setLoadingDetails(true);
        setExpandedPackage(pkg);

        try {
            let endpoint = "";
            // Determine which endpoint to call based on package type
            if (pkg.package.toUpperCase().includes("PERFORMA") || pkg.package.toUpperCase().includes("RED AND GREEN")) {
                endpoint = `http://10.24.0.81:3009/gnr-master?plant=${pkg.plant}&line=${pkg.line}&machine=${pkg.machine}&type=${encodeURIComponent(pkg.package)}`;
            } else if (pkg.package.toUpperCase().includes("CHECKLIST")) {
                endpoint = `http://10.24.0.81:3009/checklist-master?plant=${pkg.plant}&line=${pkg.line}&machine=${pkg.machine}&type=${encodeURIComponent(pkg.package)}`;
            } else {
                // For other packages, try to fetch from GNR first
                endpoint = `http://10.24.0.81:3009/gnr-master?plant=${pkg.plant}&line=${pkg.line}&machine=${pkg.machine}&type=${encodeURIComponent(pkg.package)}`;
            }

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setPackageDetails(data || []);

                if (data.length === 0) {
                    toast.info(`No detail data found for ${pkg.package}`);
                } else {
                    toast.success(`Loaded ${data.length} records for ${pkg.package}`);
                }
            } else {
                toast.error("Failed to fetch package details");
                setPackageDetails([]);
            }
        } catch (error) {
            console.error("Error fetching package details:", error);
            toast.error("Error loading package details");
            setPackageDetails([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCheckboxChange = (pkgId) => {
        setSelectedPackages(prev => ({
            ...prev,
            [pkgId]: !prev[pkgId]
        }));
    };

    const handleToggleDetailVisibility = async (detail, isGnr = true) => {
        try {
            const endpoint = detail.visibility === false
                ? `http://10.24.0.81:3009/${isGnr ? 'gnr' : 'checklist'}-master/enable/${detail.id}`
                : `http://10.24.0.81:3009/${isGnr ? 'gnr' : 'checklist'}-master/disable/${detail.id}`;

            const response = await fetch(endpoint, { method: "PATCH" });
            if (response.ok) {
                toast.success(
                    `${isGnr ? 'GNR' : 'Checklist'} record ${detail.visibility === false ? "enabled" : "disabled"} successfully`
                );

                if (expandedPackage) {
                    fetchPackageDetails(expandedPackage);
                }
                if (isGnr && globalThis.gnrForceRefresh) {
                    console.log("🔁 Triggered GNR global refresh after toggle visibility");
                    globalThis.gnrForceRefresh();
                } else if (!isGnr && globalThis.checklistForceRefresh) {
                    console.log("🔁 Triggered Checklist global refresh after toggle visibility");
                    globalThis.checklistForceRefresh();
                }
            } else {
                toast.error("Failed to update visibility");
            }
        } catch (error) {
            console.error("Error toggling visibility:", error);
            toast.error("Error updating visibility");
        }
    };

    const handleDeleteDetail = async (detail, isGnr = true) => {
        setConfirmAction({
            type: "deleteDetail",
            detail,
            isGnr,
            packageName: expandedPackage?.package,
            execute: async () => {
                await performDeleteDetail(detail, isGnr);
            }
        });
        setShowConfirmModal(true);
    };

    const performDeleteDetail = async (detail, isGnr) => {
        try {
            const endpoint = isGnr
                ? `http://10.24.0.81:3009/gnr-master/delete/${detail.id}`
                : `http://10.24.0.81:3009/checklist-master/delete/${detail.id}`;

            const response = await fetch(endpoint, { method: "DELETE" });

            if (response.ok) {
                const result = await response.json();
                toast.success(
                    `🗑️ Deleted Successfully!\n` +
                    `${isGnr ? 'GNR' : 'Checklist'} ID: ${detail.id}\n` +
                    `Rows removed: ${result.rowsAffected || 1}`
                );

                setShowConfirmModal(false);
                setConfirmAction(null);

                if (expandedPackage) {
                    fetchPackageDetails(expandedPackage);
                }

                if (isGnr && globalThis.gnrForceRefresh) {
                    console.log("🔁 Triggered GNR global refresh after delete");
                    globalThis.gnrForceRefresh();
                } else if (!isGnr && globalThis.checklistForceRefresh) {
                    console.log("🔁 Triggered Checklist global refresh after delete");
                    globalThis.checklistForceRefresh();
                }
            } else {
                const error = await response.json();
                toast.error(`Failed to delete: ${error.message || "Unknown error"}`);
                setShowConfirmModal(false);
                setConfirmAction(null);
            }
        } catch (error) {
            console.error("Error deleting detail:", error);
            toast.error("Error deleting record. Check console.");
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const handleEditDetail = (detail, isGnr = true) => {
        setEditingItem({
            ...detail,
            editType: isGnr ? 'gnr' : 'checklist',
            package: expandedPackage?.package,
            line: expandedPackage?.line
        });
        setShowEditModal(true);
    };

    const handleAddNewRecord = (isGnr = true) => {
        if (!expandedPackage) return;

        setAddingRecordType(isGnr ? 'gnr' : 'checklist');

        if (isGnr) {
            setNewRecord({
                plant: expandedPackage.plant,
                line: expandedPackage.line,
                machine: expandedPackage.machine,
                package_type: expandedPackage.package,
                activity: '',
                frekuensi: 'Tiap Jam',
                status: 1,
                good: '',
                need: '',
                reject: '',
                _frekuensiMode: 'dropdown',
                _customFrekuensi: ''
            });
        } else {
            setNewRecord({
                plant: expandedPackage.plant,
                line: expandedPackage.line,
                machine: expandedPackage.machine,
                package_type: expandedPackage.package,
                job_type: '',
                componen: '',
                standart: '',
                pic: 'operator',
                duration: '',
                maintanance_interval: ''
            });
        }
        setShowAddModal(true);
    };

    const handleSaveNewRecord = async () => {
        if (!newRecord || !addingRecordType) return;

        // Validasi input
        if (addingRecordType === 'gnr') {
            if (!newRecord.activity || !newRecord.frekuensi || !newRecord.good) {
                toast.warn("Activity, Frekuensi, dan Good wajib diisi!");
                return;
            }
        } else {
            if (!newRecord.job_type || !newRecord.componen || !newRecord.standart) {
                toast.warn("Job Type, Component, dan Standart wajib diisi!");
                return;
            }
        }

        try {
            setModalLoading(true);
            const endpoint = addingRecordType === 'gnr'
                ? `http://10.24.0.81:3009/gnr-master/create`
                : `http://10.24.0.81:3009/checklist-master/create`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(
                    `✅ ${addingRecordType === 'gnr' ? 'GNR' : 'Checklist'} record created successfully!\n` +
                    `📱 Line: ${expandedPackage?.line}\n` +
                    `🔄 Data akan otomatis tersedia di mobile app setelah refresh.`
                );
                setShowAddModal(false);
                setNewRecord({});
                setAddingRecordType(null);

                setTimeout(() => {
                    if (expandedPackage) {
                        console.log(`🔄 Refreshing details for ${expandedPackage.line}...`);
                        fetchPackageDetails(expandedPackage);

                        if (addingRecordType === 'gnr' && globalThis.gnrForceRefresh) {
                            globalThis.gnrForceRefresh();
                            console.log("✅ Triggered global GNR refresh");
                        }

                        if (addingRecordType === 'checklist' && globalThis.checklistForceRefresh) {
                            globalThis.checklistForceRefresh();
                            console.log("✅ Triggered global Checklist refresh");
                        }
                    }
                }, 500);
            } else {
                const error = await response.json();
                toast.error(`Failed to create: ${error.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error creating record:", error);
            toast.error("Error creating record. Check console.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        try {
            setModalLoading(true);
            const endpoint = editingItem.editType === 'gnr'
                ? `http://10.24.0.81:3009/gnr-master/update/${editingItem.id}`
                : `http://10.24.0.81:3009/checklist-master/update/${editingItem.id}`;

            const payload = editingItem.editType === 'gnr'
                ? {
                    activity: editingItem.activity,
                    frekuensi: editingItem.frekuensi,
                    good: editingItem.good,
                    need: editingItem.need,
                    reject: editingItem.reject
                }
                : {
                    job_type: editingItem.job_type,
                    componen: editingItem.componen,
                    standart: editingItem.standart
                };

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(`${editingItem.editType === 'gnr' ? 'GNR' : 'Checklist'} updated successfully`);
                setShowEditModal(false);
                setEditingItem(null);

                // Refresh details
                if (expandedPackage) {
                    fetchPackageDetails(expandedPackage);
                }
            } else {
                toast.error("Failed to update");
            }
        } catch (error) {
            console.error("Error updating:", error);
            toast.error("Error updating. Check console.");
        } finally {
            setModalLoading(false);
        }
    };

    const fetchLinePackages = async (lineName) => {
        const filtered = allPackages.filter(pkg => pkg.line === lineName);

        const uniquePackages = filtered.filter(
            (pkg, index, self) => index === self.findIndex(p => p.package === pkg.package)
        );

        setLinePackagesMap(prev => ({
            ...prev,
            [lineName]: uniquePackages
        }));

        setExpandedLines(prev => (
            prev.includes(lineName) ? prev : [...prev, lineName]
        ));

        toast.info(
            `Loaded ${uniquePackages.length} package(s) for ${lineName}`
        );
    };

    const handleSelectAll = () => {
        const allSelected = {};
        referencePackages.forEach(pkg => {
            allSelected[pkg.id] = true;
        });
        setSelectedPackages(allSelected);
        toast.info("All packages selected");
    };

    const handleDeselectAll = () => {
        setSelectedPackages({});
        toast.info("All packages deselected");
    };

    const handleSubmit = async () => {
        if (!newLineName.trim()) {
            toast.warn("Please enter a new line name");
            return;
        }

        if (!selectedReferenceLine) {
            toast.warn("Please select a reference line");
            return;
        }

        const selectedPkgList = referencePackages.filter(pkg => selectedPackages[pkg.id]);
        if (selectedPkgList.length === 0) {
            toast.warn("Please select at least one package");
            return;
        }

        if (uniqueLines.includes(newLineName.trim())) {
            toast.error("Line name already exists! Choose a different name.");
            return;
        }

        setConfirmAction({
            type: "create",
            execute: async () => {
                try {
                    setLoading(true);
                    const payload = {
                        line: newLineName.trim(),
                        line_reference: selectedReferenceLine,
                        packages: selectedPkgList.map(pkg => pkg.package)
                    };

                    const response = await fetch("http://10.24.0.81:3009/line-master/create-from", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        toast.success(
                            `✅ Line "${newLineName}" created successfully!\n` +
                            `📦 Packages: ${result.rowsAffected || selectedPkgList.length}\n` +
                            `⚡ GNR: ${result.gnr?.rowsAffected || 0}\n` +
                            `✓ Checklist: ${result.checklist?.rowsAffected || 0}`
                        );

                        setNewLineName("");
                        setSelectedReferenceLine("");
                        setReferencePackages([]);
                        setSelectedPackages({});
                        fetchAllPackages();
                    } else {
                        const error = await response.json();
                        toast.error(`Failed: ${error.message || "Unknown error"}`);
                    }
                } catch (error) {
                    console.error("Error creating line:", error);
                    toast.error("Error creating line. Check console.");
                } finally {
                    setLoading(false);
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        });
        setShowConfirmModal(true);
    };

    const handleDeleteLine = async (lineName) => {
        if (!lineName) return;

        setConfirmAction({
            type: "delete",
            lineName,
            execute: async () => {
                try {
                    setLoading(true);
                    const response = await fetch(
                        `http://10.24.0.81:3009/line-master/delete-line/${encodeURIComponent(lineName)}`,
                        { method: "DELETE" }
                    );

                    if (response.ok) {
                        const result = await response.json();
                        toast.success(
                            `🗑️ Line "${lineName}" deleted!\n` +
                            `Total: ${result.totalDeleted} records removed`
                        );

                        fetchAllPackages();
                        if (selectedReferenceLine === lineName) {
                            setSelectedReferenceLine("");
                        }
                    } else {
                        const error = await response.json();
                        toast.error(`Delete failed: ${error.message || "Unknown error"}`);
                    }
                } catch (error) {
                    console.error("Error deleting line:", error);
                    toast.error("Error deleting line. Check console.");
                } finally {
                    setLoading(false);
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        });
        setShowConfirmModal(true);
    };

    const handleEditModalClose = useCallback(() => {
        setShowEditModal(false);
        setEditingItem(null);
    }, []);

    const handleAddModalClose = useCallback(() => {
        setShowAddModal(false);
        setNewRecord({});
        setAddingRecordType(null);
    }, []);

    const handleOpenCustomModal = (type) => {
        setCustomizationType(type);
        setShowCustomModal(true);
    };

    // handleSaveCustomItem
    const handleSaveCustomItem = async (data) => {
        try {
            setModalLoading(true);

            let endpoint = "";
            let payload = {};

            switch (data.type) {
                case "plant":
                    endpoint = "http://10.24.0.81:3009/custom/plants/create";
                    payload = { plant: data.value };
                    break;

                case "machine":
                    endpoint = "http://10.24.0.81:3009/custom/machines/create";
                    payload = { machine: data.value };
                    break;

                case "package":
                    // Auto-create plant
                    if (data.isNewPlant && data.plant) {
                        try {
                            await fetch("http://10.24.0.81:3009/custom/plants/create", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ plant: data.plant })
                            });
                            toast.success(`✅ New plant "${data.plant}" created`);
                        } catch (err) {
                            console.log("Plant might already exist:", err);
                        }
                    }

                    // Auto-create machine
                    if (data.isNewMachine && data.machine) {
                        try {
                            await fetch("http://10.24.0.81:3009/custom/machines/create", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ machine: data.machine })
                            });
                            toast.success(`✅ New machine "${data.machine}" created`);
                        } catch (err) {
                            console.log("Machine might already exist:", err);
                        }
                    }

                    // Create in metadata table (tb_CILT_custom)
                    const metadataResponse = await fetch("http://10.24.0.81:3009/custom/packages/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            plant: data.plant,
                            machine: data.machine,
                            line: data.line,
                            package: data.value,
                            header: JSON.stringify({ description: data.description }),
                            item: JSON.stringify([])
                        })
                    });

                    if (!metadataResponse.ok) {
                        throw new Error("Failed to create metadata");
                    }

                    const metadataResult = await metadataResponse.json();
                    console.log("✅ Metadata created:", metadataResult);

                    // Create in package designer table (tb_CILT_custom_packages)
                    const packageResponse = await fetch("http://10.24.0.81:3009/custom/packages/packages/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            plant: data.plant,
                            machine: data.machine,
                            line: data.line,
                            package: data.value,
                            header: JSON.stringify({ description: data.description }),
                            item: JSON.stringify([])
                        })
                    });

                    if (!packageResponse.ok) {
                        throw new Error("Failed to create package designer");
                    }

                    const packageResult = await packageResponse.json();
                    console.log("✅ Package designer created:", packageResult);

                    toast.success(
                        `✅ Package "${data.value}" created successfully!\n` +
                        `📋 Metadata ID: ${metadataResult.data?.[0]?.id}\n` +
                        `📦 Designer ID: ${packageResult.data?.[0]?.id}`
                    );

                    // Open package designer with the newly created package
                    const newPackageId = packageResult.data?.[0]?.id;
                    setDesigningPackage({
                        id: newPackageId,
                        plant: data.plant,
                        machine: data.machine,
                        line: data.line,
                        package: data.value,
                        description: data.description
                    });
                    setShowPackageDesigner(true);

                    setShowCustomModal(false);
                    setCustomizationType(null);
                    await fetchCustomItems();
                    return;

                default:
                    throw new Error("Invalid type");
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(
                    `✅ ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} "${data.value}" created successfully!`
                );

                setShowCustomModal(false);
                setCustomizationType(null);
                await fetchCustomItems();
            } else {
                const error = await response.json();
                toast.error(`Failed: ${error.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error creating custom item:", error);
            toast.error(`Error creating item: ${error.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    // handleEditCustomItem
    const handleEditCustomItem = async (type, id, data) => {
        try {
            setModalLoading(true);

            let endpoint = "";
            let payload = {};

            switch (type) {
                case "plant":
                    endpoint = `http://10.24.0.81:3009/custom/plants/update/${id}`;
                    payload = { plant: data.value };
                    break;

                case "machine":
                    endpoint = `http://10.24.0.81:3009/custom/machines/update/${id}`;
                    payload = { machine: data.value };
                    break;

                case "package":
                    endpoint = `http://10.24.0.81:3009/custom/packages/update/${id}`;

                    payload = {
                        plant: data.plant,
                        machine: data.machine,
                        line: data.line,
                        package: data.value,
                        header: JSON.stringify({ description: data.description }),
                        item: data.item || JSON.stringify([])
                    };
                    const oldPackage = customItems.packages.find(p => p.id === id);
                    if (oldPackage) {
                        try {
                            // Find metadata record by matching fields
                            const metadataResponse = await fetch("http://10.24.0.81:3009/custom");
                            if (metadataResponse.ok) {
                                const metadataList = await metadataResponse.json();
                                const metadataRecord = metadataList.data?.find(
                                    m => m.plant === oldPackage.plant &&
                                        m.machine === oldPackage.machine &&
                                        m.line === oldPackage.line &&
                                        m.package === oldPackage.name
                                );

                                if (metadataRecord) {
                                    await fetch(`http://10.24.0.81:3009/custom/update/${metadataRecord.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            plant: data.plant,
                                            machine: data.machine,
                                            line: data.line,
                                            package: data.value,
                                            header: JSON.stringify({ description: data.description }),
                                            item: data.item || JSON.stringify([])
                                        })
                                    });
                                    toast.info("✅ Metadata also updated");
                                }
                            }
                        } catch (err) {
                            console.log("Metadata update error:", err);
                        }
                    }
                    break;

                default:
                    throw new Error("Invalid type");
            }

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(`✅ ${type} updated successfully!`);
                setEditCustomModal({ show: false, type: null, item: null });
                await fetchCustomItems();
            } else {
                const error = await response.json();
                toast.error(`Failed: ${error.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error updating custom item:", error);
            toast.error("Error updating item");
        } finally {
            setModalLoading(false);
        }
    };

    // OPEN EDIT MODAL
    const handleOpenEditCustomModal = (type, item) => {
        setEditCustomModal({
            show: true,
            type,
            item
        });
    };

    const handleDeleteCustomItem = async (type, id, name) => {
        setConfirmAction({
            type: "deleteCustom",
            customType: type,
            id,
            name,
            execute: async () => {
                try {
                    if (type === "package") {
                        const packageToDelete = customItems.packages.find(p => p.id === id);
                        if (packageToDelete) {
                            // Check if plant should be deleted
                            const plantExists = customItems.plants.find(p => p.name === packageToDelete.plant);
                            if (plantExists) {
                                // Check if other packages use this plant
                                const otherPackagesWithPlant = customItems.packages.filter(
                                    p => p.plant === packageToDelete.plant && p.id !== id
                                );

                                if (otherPackagesWithPlant.length === 0) {
                                    try {
                                        await fetch(`http://10.24.0.81:3009/custom/plants/delete/${plantExists.id}`, {
                                            method: "DELETE"
                                        });
                                        toast.success(`Associated plant "${packageToDelete.plant}" also deleted`);
                                    } catch (err) {
                                        console.log("Plant delete error:", err);
                                    }
                                }
                            }

                            // Check if machine should be deleted
                            const machineExists = customItems.machines.find(m => m.name === packageToDelete.machine);
                            if (machineExists) {
                                const otherPackagesWithMachine = customItems.packages.filter(
                                    p => p.machine === packageToDelete.machine && p.id !== id
                                );

                                if (otherPackagesWithMachine.length === 0) {
                                    try {
                                        await fetch(`http://10.24.0.81:3009/custom/machines/delete/${machineExists.id}`, {
                                            method: "DELETE"
                                        });
                                        toast.success(`Associated machine "${packageToDelete.machine}" also deleted`);
                                    } catch (err) {
                                        console.log("Machine delete error:", err);
                                    }
                                }
                            }
                        }
                    }

                    let endpoint = "";
                    switch (type) {
                        case "plant":
                            endpoint = `http://10.24.0.81:3009/custom/plants/delete/${id}`;
                            break;
                        case "machine":
                            endpoint = `http://10.24.0.81:3009/custom/machines/delete/${id}`;
                            break;
                        case "package":
                            endpoint = `http://10.24.0.81:3009/custom/packages/delete/${id}`;
                            break;
                        default:
                            throw new Error("Invalid type");
                    }

                    const response = await fetch(endpoint, { method: "DELETE" });

                    if (response.ok) {
                        const result = await response.json();
                        if (type === "package") {
                            toast.success(
                                `🗑️ Package "${name}" deleted!\n` +
                                `📦 Designer records: ${result.rowsAffected}\n` +
                                `📋 Metadata records: ${result.metadataRowsAffected || 0}`
                            );
                        } else {
                            toast.success(`🗑️ ${type} "${name}" deleted!`);
                        }
                        fetchCustomItems();
                    } else {
                        const error = await response.json();
                        toast.error(`Failed to delete: ${error.message || "Unknown error"}`);
                    }
                } catch (error) {
                    console.error("Error deleting custom item:", error);
                    toast.error("Error deleting item");
                } finally {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        });

        setShowConfirmModal(true);
    };

    const selectedCount = Object.values(selectedPackages).filter(Boolean).length;
    const isAnyModalOpen = showEditModal || showAddModal || showCustomModal || editCustomModal.show || showConfirmModal;
    useBodyScrollLock(isAnyModalOpen);

    // Save Package Design
    const handleSavePackageDesign = async (designData) => {
        try {
            setModalLoading(true);
            console.log("💾 Saving package design for ID:", designingPackage.id);

            // PERBAIKAN: Gunakan endpoint yang benar
            const endpoint = `http://10.24.0.81:3009/custom/packages/packages/update/${designingPackage.id}`;

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(designData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log("✅ Save successful:", result);
                toast.success("✅ Package design saved successfully!");
                setShowPackageDesigner(false);
                setDesigningPackage(null);
                await fetchCustomItems(); // Refresh custom items list
            } else {
                const error = await response.json();
                console.error("❌ Save failed:", error);
                toast.error(`Failed: ${error.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error("❌ Error saving package design:", error);
            toast.error("Error saving design");
        } finally {
            setModalLoading(false);
        }
    };

    // Open designer for existing package
    const handleOpenPackageDesigner = (packageItem) => {
        setDesigningPackage({
            id: packageItem.id,
            plant: packageItem.plant,
            machine: packageItem.machine,
            line: packageItem.line,
            package: packageItem.name,
            description: packageItem.description,
            header: packageItem.header,
            item: packageItem.item
        });
        setShowPackageDesigner(true);
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Toast Container */}
                <div className="fixed top-20 right-4 z-50 space-y-2">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className={`px-6 py-4 rounded-lg shadow-lg animate-slide-in max-w-md ${t.type === 'success' ? 'bg-green-500 text-white' :
                                t.type === 'error' ? 'bg-red-500 text-white' :
                                    t.type === 'warning' ? 'bg-yellow-500 text-white' :
                                        'bg-blue-500 text-white'
                                }`}
                        >
                            <p className="text-sm font-medium whitespace-pre-line">{t.message}</p>
                        </div>
                    ))}
                </div>

                {/* Package Designer Modal */}
                <PackageDesignerModal
                    show={showPackageDesigner}
                    onClose={() => {
                        setShowPackageDesigner(false);
                        setDesigningPackage(null);
                    }}
                    onSave={handleSavePackageDesign}
                    packageData={designingPackage}
                    isLoading={modalLoading}
                />

                <main className="flex-1 bg-white px-8 pt-16 pb-8">

                    {/* CUSTOMIZATION MODAL 1 */}
                    <CustomizationModal
                        show={showCustomModal}
                        onClose={() => {
                            setShowCustomModal(false);
                            setCustomizationType(null);
                        }}
                        customType={customizationType}
                        onSave={handleSaveCustomItem}
                        isLoading={modalLoading}
                        availablePlants={customItems.plants}
                        availableMachines={customItems.machines}
                        availableLines={availableLines}
                        editMode={false}
                        editData={null}
                    />

                    {/* CUSTOMIZATION MODAL 2 */}
                    <CustomizationModal
                        show={editCustomModal.show}
                        onClose={() =>
                            setEditCustomModal({ show: false, type: null, item: null })
                        }
                        customType={editCustomModal.type}
                        onSave={(data) =>
                            handleEditCustomItem(editCustomModal.type, editCustomModal.item?.id, data)
                        }
                        isLoading={modalLoading}
                        availablePlants={customItems.plants}
                        availableMachines={customItems.machines}
                        availableLines={availableLines}
                        editMode={true}
                        editData={editCustomModal.item}
                    />

                    <EditModal
                        show={showEditModal}
                        onClose={handleEditModalClose}
                        onSave={handleSaveEdit}
                        item={editingItem}
                        onItemChange={setEditingItem}
                        isLoading={modalLoading}
                    />

                    <AddRecordModal
                        show={showAddModal}
                        onClose={handleAddModalClose}
                        onSave={handleSaveNewRecord}
                        recordType={addingRecordType}
                        record={newRecord}
                        onRecordChange={setNewRecord}
                        isLoading={modalLoading}
                    />

                    <ConfirmModal
                        show={showConfirmModal}
                        onClose={() => {
                            setShowConfirmModal(false);
                            setConfirmAction(null);
                        }}
                        onConfirm={() => {
                            if (confirmAction) {
                                confirmAction.execute();
                            }
                        }}
                        action={confirmAction}
                        newLineName={newLineName}
                        selectedReferenceLine={selectedReferenceLine}
                        selectedPackages={selectedPackages}
                    />

                    {/* CUSTOMIZATION SECTION UI */}
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-300 rounded-xl px-6 py-5 mb-4 shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">System Customization</h3>
                                    <p className="text-white/90 text-sm">
                                        Manage plants, machines, and package types for CILTpro mobile app
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
                            <div className="p-6">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                    {/* PLANTS CARD */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Factory className="w-5 h-5 text-white" />
                                                <h4 className="text-white font-bold text-sm">Plants</h4>
                                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                    {Array.isArray(customItems.plants) ? customItems.plants.length : 0}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenCustomModal("plant")}
                                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* PLANT LIST */}
                                        <div className="p-4 max-h-64 overflow-y-auto bg-white">
                                            {loadingCustomItems ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                                                </div>
                                            ) : !Array.isArray(customItems.plants) ||
                                                customItems.plants.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <Factory className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                                                    <p className="text-sm text-gray-500 font-medium">No plants yet</p>
                                                    <p className="text-xs text-gray-400 mt-1">Click + to add</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {customItems.plants.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg group hover:from-blue-100 hover:to-blue-50 transition-all border border-blue-100"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                                {item.description && (
                                                                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={() => handleOpenEditCustomModal("plant", item)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteCustomItem("plant", item.id, item.name)
                                                                    }
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* MACHINES CARD */}
                                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Cpu className="w-5 h-5 text-white" />
                                                <h4 className="text-white font-bold text-sm">Machines</h4>
                                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                    {customItems.machines.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenCustomModal("machine")}
                                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* MACHINE LIST */}
                                        <div className="p-4 max-h-64 overflow-y-auto bg-white">
                                            {loadingCustomItems ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                                                </div>
                                            ) : customItems.machines.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <Cpu className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                                                    <p className="text-sm text-gray-500 font-medium">No machines yet</p>
                                                    <p className="text-xs text-gray-400 mt-1">Click + to add</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {customItems.machines.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg group hover:from-emerald-100 hover:to-emerald-50 transition-all border border-emerald-100"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                                {item.description && (
                                                                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={() => handleOpenEditCustomModal("machine", item)}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteCustomItem("machine", item.id, item.name)
                                                                    }
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* PACKAGE TYPES CARD */}
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Box className="w-5 h-5 text-white" />
                                                <h4 className="text-white font-bold text-sm">Package Types</h4>
                                                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                    {customItems.packages.length}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleOpenCustomModal("package")}
                                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* PACKAGE LIST */}
                                        <div className="p-4 max-h-64 overflow-y-auto bg-white">
                                            {loadingCustomItems ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                                                </div>
                                            ) : customItems.packages.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <Box className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                                                    <p className="text-sm text-gray-500 font-medium">No package types yet</p>
                                                    <p className="text-xs text-gray-400 mt-1">Click + to add</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {customItems.packages.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg group hover:from-purple-100 hover:to-purple-50 transition-all border border-purple-100"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-800">{item.name}</p>

                                                                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                                                    <p className="flex items-center gap-1">
                                                                        <span className="font-semibold">📦</span> {item.plant} •{" "}
                                                                        {item.machine} • {item.line}
                                                                    </p>
                                                                    {item.description && (
                                                                        <p className="text-gray-500 italic">{item.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={() => handleOpenPackageDesigner(item)}
                                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded"
                                                                    title="Design Package"
                                                                >
                                                                    <Grid className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={() => handleOpenEditCustomModal("package", item)}
                                                                    className="p-1.5 text-purple-600 hover:bg-purple-100 rounded"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteCustomItem("package", item.id, item.name)
                                                                    }
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer Info */}
                                <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                                    <p className="text-xs text-gray-600">
                                        <strong className="text-blue-700">ℹ️ Info:</strong> Custom configurations will
                                        be available in the mobile CILTpro app.

                                        <span className="text-gray-500 mt-2 block">
                                            ⚡ <strong>Auto-Create Feature:</strong> When adding a package, typing a NEW
                                            plant or machine will create it automatically.
                                        </span>
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Info Card - Master Line Configuration */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Master Line Configuration</p>
                                <p className="text-xs text-gray-600">Create new lines by copying packages from existing lines. Click on packages to view details.</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Line Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative text-black">
                                    <input
                                        type="text"
                                        value={newLineName}
                                        onChange={(e) => setNewLineName(e.target.value)}
                                        placeholder="e.g., LINE E, LINE F, etc."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                    <GitBranch className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Copy From Line / Modified Package Line <span className="text-red-500">*</span>
                                </label>
                                <div className="relative text-black">
                                    <select
                                        value={selectedReferenceLine}
                                        onChange={(e) => setSelectedReferenceLine(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                                    >
                                        <option value="">-- Select Reference Line --</option>
                                        {uniqueLines.map(line => (
                                            <option key={line} value={line}>{line}</option>
                                        ))}
                                    </select>
                                    <Copy className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Package Selection Section with Details */}
                    {selectedReferenceLine && referencePackages.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                            <div className="bg-emerald-600 px-6 py-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-6 h-6 text-white" />
                                        <div>
                                            <h3 className="text-white font-bold text-lg">
                                                Packages from {selectedReferenceLine}
                                            </h3>
                                            <p className="text-white/90 text-sm">
                                                {selectedCount} of {referencePackages.length} selected - Click package to view details
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSelectAll}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded text-sm"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={handleDeselectAll}
                                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded text-sm"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-2">
                                {referencePackages.map((pkg) => (
                                    <div key={pkg.id} className="border border-gray-300 rounded overflow-hidden">
                                        {/* Package Header */}
                                        <div
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-all ${selectedPackages[pkg.id] ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => fetchPackageDetails(pkg)}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedPackages[pkg.id]}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleCheckboxChange(pkg.id);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-5 h-5 rounded"
                                                />

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-gray-900">{pkg.package}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pkg.visibility === false ? 'bg-gray-300 text-gray-700' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {pkg.visibility === false ? 'Hidden' : 'Visible'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        <span>ID: {pkg.id}</span>
                                                        <span>Plant: {pkg.plant}</span>
                                                        <span>Machine: {pkg.machine}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {expandedPackage?.id === pkg.id ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-600" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Package Details */}
                                        {expandedPackage?.id === pkg.id && (
                                            <div className="border-t border-gray-200 bg-white">
                                                {loadingDetails ? (
                                                    <div className="p-8 text-center">
                                                        <RefreshCw className="w-7 h-7 animate-spin mx-auto text-gray-500 mb-2" />
                                                        <p className="text-gray-600">Loading details...</p>
                                                    </div>
                                                ) : packageDetails.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <Database className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                                        <p className="text-gray-500">No detail data available for this package</p>

                                                        {/* Tombol Add Record yang benar */}
                                                        <div className="mt-4 flex gap-3 justify-center">
                                                            {(pkg.package.toUpperCase().includes("PERFORMA") || pkg.package.toUpperCase().includes("RED AND GREEN")) && (
                                                                <button
                                                                    onClick={() => handleAddNewRecord(true)}
                                                                    className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-all flex items-center gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add GNR Record
                                                                </button>
                                                            )}

                                                            {pkg.package.toUpperCase().includes("CHECKLIST") && (
                                                                <button
                                                                    onClick={() => handleAddNewRecord(false)}
                                                                    className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-all flex items-center gap-2"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Checklist Record
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Tombol Add Record yang benar */}
                                                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-end gap-2">
                                                            {(pkg.package.toUpperCase().includes("PERFORMA") || pkg.package.toUpperCase().includes("RED AND GREEN")) && (
                                                                <button
                                                                    onClick={() => handleAddNewRecord(true)}
                                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-all flex items-center gap-1.5 text-sm"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Add New GNR Record
                                                                </button>
                                                            )}
                                                            {pkg.package.toUpperCase().includes("CHECKLIST") && (
                                                                <button
                                                                    onClick={() => handleAddNewRecord(false)}
                                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-all flex items-center gap-1.5 text-sm"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Add New Checklist Record
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">ID</th>
                                                                        {packageDetails[0]?.activity !== undefined && (
                                                                            <>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Activity</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Frekuensi</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Good</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Need</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Reject</th>
                                                                            </>
                                                                        )}
                                                                        {packageDetails[0]?.job_type !== undefined && (
                                                                            <>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Job Type</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Component</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Standart</th>
                                                                                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">PIC</th>
                                                                            </>
                                                                        )}
                                                                        <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Visibility</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {packageDetails.map((detail, idx) => {
                                                                        const isGnr = detail.activity !== undefined;
                                                                        return (
                                                                            <tr key={detail.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                                <td className="py-2 px-3 text-gray-900">{detail.id}</td>
                                                                                {isGnr ? (
                                                                                    <>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.activity}>
                                                                                            {detail.activity}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900">{detail.frekuensi}</td>
                                                                                        <td className="py-2 px-3">
                                                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detail.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                                                                                }`}>
                                                                                                {detail.status === 1 ? 'Active' : 'Inactive'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.good}>
                                                                                            {detail.good}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.need}>
                                                                                            {detail.need || '-'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.reject}>
                                                                                            {detail.reject || '-'}
                                                                                        </td>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <td className="py-2 px-3 text-gray-900">{detail.job_type}</td>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.componen}>
                                                                                            {detail.componen}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900 max-w-xs truncate" title={detail.standart}>
                                                                                            {detail.standart}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-gray-900">{detail.pic || '-'}</td>
                                                                                    </>
                                                                                )}
                                                                                <td className="py-2 px-3">
                                                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${detail.visibility === false ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                                                                                        }`}>
                                                                                        {detail.visibility === false ? (
                                                                                            <>
                                                                                                <EyeOff className="w-3 h-3" />
                                                                                                Hidden
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <Eye className="w-3 h-3" />
                                                                                                Visible
                                                                                            </>
                                                                                        )}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-2 px-3">
                                                                                    <div className="flex gap-2">
                                                                                        <button
                                                                                            onClick={() => handleToggleDetailVisibility(detail, isGnr)}
                                                                                            className={`px-2 py-1 rounded text-xs font-medium transition-all ${detail.visibility === false
                                                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                                                }`}
                                                                                        >
                                                                                            {detail.visibility === false ? 'Enable' : 'Hide'}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleEditDetail(detail, isGnr)}
                                                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-all flex items-center gap-1"
                                                                                        >
                                                                                            <Edit className="w-3 h-3" />
                                                                                            Edit
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeleteDetail(detail, isGnr)}
                                                                                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium transition-all flex items-center gap-1"
                                                                                        >
                                                                                            <Trash2 className="w-3 h-3" />
                                                                                            Delete
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end mb-8">
                        <button
                            onClick={() => {
                                setNewLineName("");
                                setSelectedReferenceLine("");
                                setReferencePackages([]);
                                setSelectedPackages({});
                                setExpandedPackage(null);
                                setPackageDetails([]);
                            }}
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Reset Form
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !newLineName || !selectedReferenceLine || selectedCount === 0}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Creating..." : "Create Line"}
                        </button>
                    </div>

                    {/* Existing Lines List with Expandable Packages */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-3.5">
                            <h3 className="text-white font-semibold text-base">Existing Lines</h3>
                            <p className="text-slate-200 text-sm">Total: {uniqueLines.length} lines - Click to view packages</p>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {uniqueLines.map(line => (
                                    <div key={line} className="border border-gray-300 rounded overflow-hidden">
                                        <div
                                            className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                                            onClick={() => {
                                                if (expandedLines.includes(line)) {
                                                    setExpandedLines([]);
                                                } else {
                                                    setExpandedLines([line]);
                                                    if (!linePackagesMap[line]) {
                                                        fetchLinePackages(line);
                                                    }
                                                }
                                            }}
                                        >
                                            <span className="font-medium text-slate-800">{line}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteLine(line);
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                                                    title="Delete line"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {expandedLines.includes(line) ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-600" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-600" />
                                                )}
                                            </div>
                                        </div>

                                        {expandedLines.includes(line) && linePackagesMap[line] && (
                                            <div className="border-t border-slate-200 max-h-96 overflow-y-auto">
                                                {linePackagesMap[line].map(pkg => (
                                                    <div key={pkg.id} className="p-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-semibold text-slate-700">{pkg.package}</span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${pkg.visibility === false ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {pkg.visibility === false ? (
                                                                    <>
                                                                        <EyeOff className="w-3 h-3" />
                                                                        Hidden
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye className="w-3 h-3" />
                                                                        Visible
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-600 mb-2">
                                                            {pkg.machine} • Plant: {pkg.plant}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
            </div >
        </MainLayout >
    );
};

export default CILTProMaster;