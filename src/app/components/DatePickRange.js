"use client";

import { useState, useEffect } from "react";

export default function DateRangePicker({ onChange }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleStartChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    if (onChange) {
      onChange({ startDate: value, endDate });
    }
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    if (onChange) {
      onChange({ startDate, endDate: value });
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Pilih Rentang Tanggal</h2>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <label>
          Mulai:
          <input
            type="date"
            value={startDate}
            onChange={handleStartChange}
            max={endDate || undefined}
          />
        </label>
        <label>
          Selesai:
          <input
            type="date"
            value={endDate}
            onChange={handleEndChange}
            min={startDate || undefined}
          />
        </label>
      </div>

      {startDate && endDate && (
        <p style={{ marginTop: "1rem" }}>
          Rentang dipilih: {startDate} sampai {endDate}
        </p>
      )}
    </div>
  );
}
