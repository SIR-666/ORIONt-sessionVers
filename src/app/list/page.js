'use client'
import React, { useEffect } from "react";
import { useState } from "react";
import ListModal from "@/app/components/ListModal";
import CreationModal from "@/app/components/CreationModal";

const List = () => {
    const [showModal, setShowModal] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [dataList, setDataList] = useState([]);

    const fetchData = async () => {
        const response = await fetch('/list.json');
        const data = await response.json();
        setDataList(data.List);
    };

    useEffect(() => {
        fetchData();
        // Load existing data from local storage if available
        const storedData = localStorage.getItem('dataList');
        if (storedData) {
          setDataList(JSON.parse(storedData));
        }
    }, []);

    const handleClick = () => {
        setShowModal(false);
        setShowForm(true);
    }

    const handleChange = () => {
        setShowForm(false);
        setShowModal(true);
    }

    const handleAdd = (newLine) => {
        const newNumber = dataList.length > 0 ? Math.max(...dataList.map(item => item.number)) + 1 : 1;
        const newEntry = { ...newLine, number: newNumber };

        const updatedData = [...dataList, newEntry];
        setDataList(updatedData);
        
        // Save to local storage
        localStorage.setItem('dataList', JSON.stringify(updatedData));
        setShowForm(false);
        setShowModal(true);
    }

    return (
        <>
            <main className="h-screen w-screen bg-[#D0D0D0]">
                {showModal && <ListModal setShowModal={setShowModal} onClick={handleClick} dataList={dataList} />}
                {showForm && <CreationModal setShowForm={setShowForm} onChange={handleChange} addNewLine={handleAdd}/>}
            </main>
        </>
    );
};

export default List;