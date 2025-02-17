'use client';
import React from "react";
import MainModal from "@/app/components/MainModal";
import { useState } from "react";

export default function Selection(){
    const [showModal, setShowModal] = useState(true);

    return(
        <>
        <main className="h-screen w-screen bg-[#D0D0D0]">
            {showModal && <MainModal setShowModal={setShowModal}/>}
        </main>
        </>
    );
};