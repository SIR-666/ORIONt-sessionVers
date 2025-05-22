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
  }, [value, plant]);

  if (loading) {
    return <LoadingSpinner />; // Tampilkan animasi loading
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
  const value = sessionStorage.getItem("line");
  const shift = sessionStorage.getItem("shift");
  const date = sessionStorage.getItem("date");
  const plant = sessionStorage.getItem("plant");
  const router = useRouter();

  if (!value || !shift || !date || !plant) {
    // Redirect to the login page if any of the required parameters are missing
    router.push("/login");
    return; // Render nothing while redirecting
  }

  return (
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <DataFetcher value={value} shift={shift} date={date} plant={plant} />
    </Suspense>
  );
}
