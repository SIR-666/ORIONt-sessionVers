"use client";
import ProdFill from "@/app/components/AddPOForm";
import ProdType from "@/app/components/AddPOType";
import Button from "@/app/components/Button";
import Modal from "@/app/components/Modal";
import Start from "@/app/components/StartPO";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import MainLayout from "../../mainLayout";

function OrderPage() {
  const [formData, setFormData] = useState([]);
  const [line, setLine] = useState("");
  const [clicked, setClicked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("value");
  const [showModal, setShowModal] = useState(false);
  const [showForm1, setShowForm1] = useState(false);
  const [showForm2, setShowForm2] = useState(false);
  const [clickedItemData, setClickedItemData] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // Track selected item ID

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      if (value) {
        const response = await fetch("/material.json");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setFormData(data.Material); // Set the table data based on the selected line
      }
    };

    fetchData();
    const storedData = localStorage.getItem("materialData");
    if (storedData) {
      setFormData(JSON.parse(storedData));
    }
    console.log(formData);
  }, [value, formData]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second

    // Clean up the timer on component unmount
    return () => clearInterval(timerId);
  }, []);

  const getItemById = (id) => {
    const item = formData.find((entry) => entry.id === id);
    if (item) {
      const existingData =
        JSON.parse(localStorage.getItem("materialData")) || [];
      if (!existingData.some((entry) => entry.id === item.id)) {
        existingData.push(item);
        localStorage.setItem("selectedMaterial", JSON.stringify(existingData));
      }
      router.push(`/main?value=${value}`); // Navigate to main page
    }
  };

  const handleAdd = (newData) => {
    const newNumber =
      formData.length > 0
        ? Math.max(...formData.map((item) => item.id)) + 1
        : 1;
    const newOrder =
      formData.length > 0
        ? Math.max(...formData.map((item) => item.order)) + 1
        : 1;
    const newEntry = { ...newData, id: newNumber, order: newOrder };

    const updatedData = [...formData, newEntry];
    setFormData(updatedData);

    const storedData = localStorage.getItem("materialData");
    let parsedData = storedData ? JSON.parse(storedData) : {};

    if (!parsedData[value]) {
      parsedData[value] = [];
    }

    parsedData[value] = [...parsedData[value], newEntry];

    //     Save to local storage
    localStorage.setItem("materialData", JSON.stringify(updatedData));
  };

  const handleDataUpdate = (id) => {
    // Update the table data based on the returned value from the modal
    // const updatedTable = formData.map(item =>
    //   item.id === selectedId ? { ...item, startTime: updatedValue } : item
    // );
    // const existingData = JSON.parse(localStorage.getItem('selectedMaterial')) || [];
    // existingData.push(updatedTable);
    // localStorage.setItem('selectedMaterial', JSON.stringify(existingData));
    // setShowStart(false); // Close modal after submission
    const item = formData.find((entry) => entry.id === id);
    if (item) {
      const existingData =
        JSON.parse(localStorage.getItem("materialData")) || [];
      if (!existingData.some((entry) => entry.id === item.id)) {
        existingData.push(item);
        localStorage.setItem("selectedMaterial", JSON.stringify(existingData));
      }
      router.push(`/main?value=${value}`); // Navigate to main page
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getUTCDate().toString().padStart(2, "0")}/${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getUTCFullYear()} ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
  };

  const currentHour = time.getHours();

  // Conditional Greeting based on the current time
  const getGreeting = () => {
    if (currentHour < 14 && currentHour >= 6) {
      return "Shift I";
    } else if (currentHour < 22 && currentHour >= 14) {
      return "Shift II";
    } else {
      return "Shift III";
    }
  };

  const openModal = (id) => {
    setSelectedId(id);
    setShowStart(true);
  };

  const handleData = (selectedLine) => {
    setLine(selectedLine);
    console.log("Line: ", selectedLine);
  };

  const handleClick = (buttonIndex) => {
    setClicked(buttonIndex);
  };

  const handleTypeButton = (selectedValue, itemData) => {
    setClickedItemData({ selectedValue, itemData });
    setShowForm1(false);
    setShowForm2(true);
  };

  return (
    <>
      <MainLayout>
        {showModal && (
          <Modal setShowModal={setShowModal} onSubmit={handleData} />
        )}
        {showForm1 && (
          <ProdType
            setShowForm1={setShowForm1}
            onItemClick={handleTypeButton}
            clickedData={value}
          />
        )}
        {showForm2 && (
          <ProdFill
            setShowForm2={setShowForm2}
            clickedData={value}
            clickedItem={clickedItemData}
            addNewData={handleAdd}
          />
        )}
        {showStart && (
          <Start
            setShowStart={setShowStart}
            id={selectedId}
            onSubmit={handleDataUpdate}
          />
        )}
        <main className="flex-1 p-8 bg-white">
          <br></br>
          <br></br>
          <div className="flex grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="mb-2">
              <button class="w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900 transition-all">
                Admin Dashboard
              </button>
            </div>
            <div class="mb-2">
              <button
                class="w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900 transition-all"
                onClick={() => router.push("../list")}
              >
                {value}
              </button>
            </div>
            <div class="mb-2">
              <button class="w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900 transition-all">
                {time.toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                - {getGreeting()}
              </button>
            </div>
            <div class="mb-2">
              <button
                class="w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900 transition-all"
                suppressHydrationWarning
              >
                {time.toLocaleTimeString()}
              </button>
            </div>
          </div>
          <br></br>
          <div class="container max-w-full mx-auto">
            <div class="relative flex items-center w-full h-12 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden">
              <div class="grid place-items-center h-full w-12 text-gray-300 px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
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
                class="peer h-full w-full outline-none text-sm text-gray-700 pr-2 bg-gray-50 px-4"
                type="text"
                id="search"
                placeholder="Search something.."
              />
            </div>
          </div>
          <br></br>
          <div className="flex grid grid-cols-4 gap-4 mr-60">
            <Button
              label="New"
              isActive={clicked === 1}
              onClick={() => handleClick(1)}
            />
            <Button
              label="All"
              isActive={clicked === 2}
              onClick={() => handleClick(2)}
            />
            <Button
              label="Active"
              isActive={clicked === 3}
              onClick={() => handleClick(3)}
            />
            <Button
              label="Completed"
              isActive={clicked === 4}
              onClick={() => handleClick(4)}
            />
          </div>
          <br></br>
          <div className="flex grid grid-cols-4 gap-4 mr-100">
            <h2 className="text-black mt-5 ml-2">Processing Plant</h2>
            <button
              class="px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
              onClick={() => setShowModal(true)}
            >
              Change Line / Shift
            </button>
          </div>
        </main>
        <div className="relative w-full h-96 rounded-xl bg-white shadow-xl">
          <div className="relative w-full overflow-x-auto flex flex-col h-full px-5 py-4">
            <table class="w-full text-sm text-left text-gray-500">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" class="py-3 px-6">
                    Order
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Material
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Quantity (carton)
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Status
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Actual Start/End Time
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Planned Start/End Time
                  </th>
                  <th scope="col" class="py-3 px-6">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.map((item) => (
                  <tr class="bg-white border-b" key={item.id}>
                    <td class="py-4 px-6">{item.order}</td>
                    <td class="py-4 px-6">{item.sku}</td>
                    <td class="py-4 px-6">{item.qty}</td>
                    <td class="py-4 px-6">{item.status}</td>
                    <td class="py-4 px-6"></td>
                    <td class="py-4 px-6">
                      <p>{formatDateTime(item.date_start)}</p>
                      <p>{formatDateTime(item.date_end)}</p>
                    </td>
                    {item.status === "New" ? (
                      <button
                        class="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
                        onClick={() => openModal(item.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="black"
                          class="size-6 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                          />
                        </svg>
                        Start
                      </button>
                    ) : item.status === "Active" ? (
                      <div>
                        <button class="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="black"
                            class="size-6 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
                            />
                          </svg>
                          Stop
                        </button>
                        <button
                          class="flex items-center justify-center w-full px-4 py-3 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 hover:m-0 focus:m-0 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
                          onClick={() => getItemById(item.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="black"
                            class="size-6 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                            />
                          </svg>
                          Details
                        </button>
                      </div>
                    ) : (
                      <button disabled>Unknown</button>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <br></br>
        <button
          class="flex items-center justify-center px-4 py-3 mb-7 rounded-full text-sm font-medium text-indigo-600 bg-white outline-none focus:outline-none m-1 border border-indigo-600 hover:border-4 focus:border-4 hover:border-indigo-800 hover:text-indigo-800 focus:border-purple-200 active:border-grey-900 active:text-grey-900"
          onClick={() => setShowForm1(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            class="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create Production Order
        </button>
      </MainLayout>
    </>
  );
}

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderPage />
    </Suspense>
  );
};

export default Page;
