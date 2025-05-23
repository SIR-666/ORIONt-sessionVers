"use client";
import OrderPage from "@/app/components/FillingClient";
import LoadingSpinner from "@/app/components/loading";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function DataFetcher({ value, shift, date, plant }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetch(
          `/api/getAllPO?value=${value}&shift=${shift}&date=${date}&plant=${plant}`
        );
        if (!fetchedData.ok) {
          throw new Error(`HTTP error! Status: ${fetchedData.status}`);
        }
        const data = await fetchedData.json();
        setData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching all PO data:", error);
        setError("Error loading data. Please try again later.");
        setLoading(false);
      }
    };

    if (value && plant) {
      fetchData();
    }
  }, [value, plant, shift, date]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    throw new Error(error);
  }

  return <OrderPage initialData={data} />;
}

export default function APICall() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchParamsWrapper />
    </Suspense>
  );
}

function SearchParamsWrapper() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState(null);
  const [shift, setShift] = useState(null);
  const [date, setDate] = useState(null);
  const [plant, setPlant] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem("line");
      const shf = sessionStorage.getItem("shift");
      const dt = sessionStorage.getItem("date");
      const plt = sessionStorage.getItem("plant");

      if (!val || !shf || !dt || !plt) {
        router.push("/login");
      } else {
        setValue(val);
        setShift(shf);
        setDate(dt);
        setPlant(plt);
        setReady(true);
      }
    }
  }, []);

  if (!ready) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <DataFetcher value={value} shift={shift} date={date} plant={plant} />
    </Suspense>
  );
}
