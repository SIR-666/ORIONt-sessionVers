import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Logo from "../../app/favicon.png"; // Path ke logo
import LogoGreenfields from "../../app/logo-greenfield-black.png";

export default function Navbar({ toggleSidebar, transparent }) {
  const [navbarOpen, setNavbarOpen] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    const shift = localStorage.getItem("shift");
    const date = localStorage.getItem("date");

    let shiftStart = null;
    let shiftEnd = null;

    const getShift = (shift, date) => {
      if (!date || isNaN(new Date(date))) {
        console.error("Invalid date provided.");
        return null;
      }
      let startTime, endTime;
      switch (shift) {
        case "I":
          startTime = new Date(date);
          startTime.setHours(6, 0, 0, 0);
          endTime = new Date(date);
          endTime.setHours(14, 0, 0, 0);
          break;
        case "II":
          startTime = new Date(date);
          startTime.setHours(14, 0, 0, 0);
          endTime = new Date(date);
          endTime.setHours(22, 0, 0, 0);
          break;
        case "III":
          startTime = new Date(date);
          startTime.setHours(22, 0, 0, 0);
          endTime = new Date(date);
          endTime.setDate(endTime.getDate() + 1); // Move to the next day
          endTime.setHours(6, 0, 0, 0);
          break;
        default:
          console.warn("Invalid shift provided.");
          return null; // Handle invalid shift
      }
      // console.log("Shift start time: ", startTime);
      // console.log("Shift end time: ", endTime);

      return { startTime, endTime };
    };

    // Only try to get shift data if `shift` and `date` are valid
    if (shift && date) {
      const shiftData = getShift(shift, date);
      if (shiftData) {
        shiftStart = shiftData.startTime;
        shiftEnd = shiftData.endTime;
      } else {
        console.warn("No shift data found for the given shift and date.");
      }
    }

    console.log("Shift Start:", shiftStart, "Shift End:", shiftEnd);

    localStorage.removeItem("profile");
    localStorage.removeItem("user");
    localStorage.removeItem("plant");
    localStorage.removeItem("tank");
    localStorage.removeItem("line");
    localStorage.removeItem("selectedMaterial");
    localStorage.removeItem("materialData");
    localStorage.removeItem("shift");
    localStorage.removeItem("date");
    localStorage.removeItem("id");
    localStorage.removeItem("group");

    // Clear specific data from local storage
    router.push("/login");
  };

  return (
    <>
      <nav
        className={
          (transparent
            ? "top-0 absolute z-50 w-full"
            : "relative shadow-lg bg-white") +
          " flex flex-wrap items-center justify-between px-2 py-3"
        }
        style={{ backgroundColor: "#6BBF74" }} // Tambahkan warna soft green
      >
        <button
          className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block outline-none focus:outline-none"
          type="button"
          onClick={() => setNavbarOpen(!navbarOpen)}
        >
          <i
            className={
              (transparent ? "text-white" : "text-gray-800") + "fa fa-bars"
            }
          ></i>
        </button>
        <button
          className="cursor-pointer text-xl leading-none px-3 py-1 outline-none focus:outline-none ml-4"
          type="button"
          onClick={toggleSidebar}
        >
          <i>
            <svg
              className="h-8 w-8 text-gray-800 bg-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </i>
        </button>
        <div className="container px-4 mx-auto flex flex-wrap items-center justify-between ml-0">
          {/* Logo dan Teks ORIONt */}
          <div className="flex items-center">
            <Image
              src={Logo}
              alt="ORIONt Logo"
              width={40} // Ukuran logo
              height={40}
              className="mr-1 " // Margin kanan untuk jarak ke teks
            />
            <span className="text-3xl font-bold text-black whitespace-nowrap">
              RIONt
            </span>
          </div>
          <div
            className={
              "lg:flex flex-grow items-center bg-white lg:bg-transparent lg:shadow-none" +
              (navbarOpen ? " block rounded shadow-lg" : " hidden")
            }
            id="example-navbar-warning"
          >
            <ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
              <li className="flex items-center">
                <a
                  className={
                    (transparent
                      ? "lg:text-white lg:hover:text-gray-300 text-gray-800"
                      : "text-gray-800 hover:text-gray-600") +
                    " px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  }
                  href="#pablo"
                >
                  <i
                    className={
                      (transparent
                        ? "lg:text-gray-300 text-gray-500"
                        : "text-gray-500") +
                      " fab fa-facebook text-lg leading-lg "
                    }
                  />
                  <span className="lg:hidden inline-block ml-2">Share</span>
                </a>
              </li>

              <li className="flex items-center">
                <a
                  className={
                    (transparent
                      ? "lg:text-white lg:hover:text-gray-300 text-gray-800"
                      : "text-gray-800 hover:text-gray-600") +
                    " px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  }
                  href="#pablo"
                >
                  <i
                    className={
                      (transparent
                        ? "lg:text-gray-300 text-gray-500"
                        : "text-gray-500") +
                      " fab fa-twitter text-lg leading-lg "
                    }
                  />
                  <span className="lg:hidden inline-block ml-2">Tweet</span>
                </a>
              </li>

              <li className="flex items-center">
                <a
                  className={
                    (transparent
                      ? "lg:text-white lg:hover:text-gray-300 text-gray-800"
                      : "text-gray-800 hover:text-gray-600") +
                    " px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
                  }
                  href="#pablo"
                >
                  <i
                    className={
                      (transparent
                        ? "lg:text-gray-300 text-gray-500"
                        : "text-gray-500") +
                      " fab fa-github text-lg leading-lg "
                    }
                  />
                  <span className="lg:hidden inline-block ml-2">Star</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="flex items-center mr-4">
            <Image
              src={LogoGreenfields}
              alt="logo-greenfields"
              width={160} // Ukuran logo
              height={160}
            />
          </div>
          <button
            type="button"
            className="inline-block rounded bg-red px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-primary-600 hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:bg-primary-600 focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] focus:outline-none focus:ring-0 active:bg-primary-700 active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </nav>
    </>
  );
}
