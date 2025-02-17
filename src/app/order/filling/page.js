'use client';
import OrderPage from "@/app/components/FillingClient";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DataFetcher({ value, shift, date }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await fetch(`/api/getAllPO?value=${value}&shift=${shift}&date=${date}`);
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

    if (value) {
      fetchData();
    }
  }, [value]);

  if (loading) {
    return null; // Suspense will wait for this promise to resolve
  }

  if (error) {
    throw new Error(error);
  }

  return <OrderPage initialData={data} />;
}

export default function APICall() {
  return (
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <SearchParamsWrapper />
    </Suspense>
  );
}

function SearchParamsWrapper() {
  const router = useSearchParams();
  const value = router.get('value');
  const shift = router.get('shift');
  const date = router.get('date');

  return (
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <DataFetcher value={value} shift={shift} date={date}/>
    </Suspense>
  );
}