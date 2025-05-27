"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../app/favicon.png"; // Path:
import LogoGreenfields from "../../app/logo-greenfield-black.png";

export default function LoginPage() {
  const [loader, setLoader] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };
  // resetting local storage so that the modal is shown
  useEffect(() => {
    // Clear the modal flag when the login page is loaded
    sessionStorage.removeItem("hasShownModal");
  });

  //declaring the router
  const router = useRouter();
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleStrapiSignIn(event);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Check if isSecure is true
    setLoader(true);

    const apiUrl2 = "http://127.0.0.1";
    const port3 = 8080;
    const endpoint = `${apiUrl2}:${port3}/login`;
    console.log("Endpoint: ", endpoint);

    const data = { email, password };
    console.log("data ", data);
    try {
      const response = await axios.post(endpoint, data);
      console.log(response);
      if (response.status === 200) {
        setLoader(false); // Stop the loader
        setResponseData(response.data); // Set response data

        // Store token and username in sessionStorage
        sessionStorage.setItem("token", JSON.stringify(response.data.token));
        sessionStorage.setItem("email", email);

        console.log("Token saved:", response.data.token);
        router.push("../order");
      } else {
        window.alert(
          "Error Logging in \n Please provide valid email or password "
        );
      }
    } catch (error) {
      console.log("the error ", error);
      window.alert(
        "Error \n Oops, Error logging in try again with correct email or password"
      );
    } finally {
      setLoader(false);
    }
  };

  const handleStrapiSignIn = async (event) => {
    event.preventDefault();
    setLoader(true);
    const urlGreat = "/api/proxyLogin";

    try {
      const res = await fetch(urlGreat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: email, // Menggunakan email dari formik
          password: password, // Menggunakan password dari formik
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        sessionStorage.setItem("user", responseData.user.email);
        sessionStorage.setItem("role", responseData.user.role.name);
        const userData = {
          email: responseData.user.email,
          username: responseData.user.username,
          profile: "user",
          role: responseData.user.role.name,
        };
        sessionStorage.setItem("profile", JSON.stringify(userData));
        document.cookie = `profile=${userData}; path=/`;
        router.push("../order");
      } else {
        const errorData = await res.json();
        console.error("Error during sign-in:", errorData);
        window.alert("Login Error: " + errorData.message);
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      window.alert("Login Error: An unexpected error occurred.");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div
      className="flex h-screen w-screen items-center justify-center bg-gray-50 "
      style={{ backgroundColor: "#A3D9A5" }}
    >
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div
          className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-6 pt-8 text-center sm:px-16"
          style={{ backgroundColor: "#EAEDED" }}
        >
          <Image src={LogoGreenfields} alt="Logo" className="h-16 w-60" />
          <div className="flex items-center mb-2">
            <Image
              src={Logo}
              alt="ORIONt Logo"
              width={40} // Ukuran logo
              height={40}
              className="mr-1" // Margin kanan untuk jarak ke teks
            />
            <span className="text-2xl font-bold text-black whitespace-nowrap">
              RIONt
            </span>
          </div>
          <h5 className="text-lg font-semibold text-gray-700">
            Online Reporting on track
          </h5>
          <p className="text-sm text-gray-500 italic">
            PT. Greenfields Indonesia
          </p>
        </div>
        <form
          className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
          onSubmit={handleStrapiSignIn}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-600 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleKeyDown}
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-600"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-600 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="password"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-600"
            />
          </div>
          <button
            className="flex h-10 w-full items-center justify-center rounded-md border text-black transition-all focus:outline-none"
            type="submit"
            /* tambahkan buat verifikasi username & password sebelum showModal */
          >
            Log In
          </button>
          <p className="text-center text-sm text-gray-600">
            {"Silahkan mendaftar di G.R.E.A.T jika belum memiliki akun, "}
            <Link
              href="http://great.greenfieldsdairy.com/account/register"
              className="font-semibold text-gray-800"
            >
              DAFTAR
            </Link>
            {" sekarang"}
          </p>
        </form>
        {loader && <p className="text-black">Loading...</p>}
      </div>
    </div>
  );
}
