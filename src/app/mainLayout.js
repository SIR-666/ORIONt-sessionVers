import Footer from "@/app/components/Footer";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar"; // Make sure to create this component

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Navbar toggleSidebar={toggleSidebar} transparent />
      <Sidebar isOpen={isSidebarOpen} />
      <main
        className={`min-h-screen flex-1 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        } p-4 sm:p-8 bg-white`}
      >
        {children}
        <br></br>
        <Footer />
      </main>
    </>
  );
}
