"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
  const router = useRouter();
  const [loader, setLoader] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [username, setUsername] = useState("");

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);

    if (newPassword.length < 8) {
      setPasswordStrength("Weak");
      setErrorMessage("Password must contain a minimum of least 8 characters");
    } else if (!/[A-Z]/.test(newPassword)) {
      setPasswordStrength("Medium");
      setErrorMessage("Password must contain at least one uppercase letter");
    } else if (!/[a-z]/.test(newPassword)) {
      setPasswordStrength("Medium");
      setErrorMessage("Password must contain at least one lowercase letter");
    } else if (!/[0-9]/.test(newPassword)) {
      setPasswordStrength("Medium");
      setErrorMessage("Password must contain at least one number");
    } else if (!/[@$!%*?&]/.test(newPassword)) {
      setPasswordStrength("Medium");
      setErrorMessage(
        "Password must include a special character `@, $, !, %, *, ?, &` "
      );
    } else {
      setPasswordStrength("Very Strong");
      setErrorMessage("");
    }
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleStrapiSignIn(event);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const urlReg = "/api/register"; // ganti ke API register

    if (passwordStrength === "Very Strong") {
      // try {
      //   setLoader(true)
      //   const res = await fetch(urlReg, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       identifier: email, // Menggunakan email dari formik
      //       password: password, // Menggunakan password dari formik
      //     }),
      //   });
      //     if (res.ok) {
      //         const responseData = await res.json();
      //         localStorage.setItem("user", responseData.user.email);
      //         const userData = {
      //           email: responseData.user.email,
      //           password: "null",
      //           username: responseData.user.username,
      //           profile: "user",
      //         };
      //         localStorage.setItem("profile", JSON.stringify(userData));
      //         router.push("../login");
      //     } else {
      //       const errorData = await res.json();
      //       console.error("Error during registration:", errorData);
      //       window.alert("Login Error: " + errorData.message);
      //     }
      // } catch (error) {
      //   console.error("Error during registration:", error);
      //   window.alert("Login Error: An unexpected error occurred.");
      // } finally {
      //   setLoader(false);
      // }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div
          className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-6 pt-8 text-center sm:px-16"
          style={{ backgroundColor: "#A3D9A5" }}
        >
          <h3 className="text-xl font-semibold text-black">Register</h3>
          <p className="text-sm text-gray-700">
            Please enter username, email, and password
          </p>
        </div>
        <form
          className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
          onSubmit={handleRegister}
        >
          <div>
            <label
              htmlFor="username"
              className="block text-xs text-gray-600 uppercase"
            >
              Email
            </label>
            <input
              id="username"
              name="username"
              type="username"
              placeholder="username"
              autoComplete="username"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleKeyDown}
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-600"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-600 uppercase"
            >
              Username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="email"
              autoComplete="email"
              value={username}
              onChange={handleUsernameChange}
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
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              required
              className="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-black focus:outline-none focus:ring-black sm:text-gray-600"
            />
            <p className="block text-xs text-gray-600">
              Password Strength: {passwordStrength}
            </p>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          </div>
          <button
            className="flex h-10 w-full items-center justify-center rounded-md border text-black transition-all focus:outline-none"
            type="submit"
            /* tambahkan buat verifikasi username & password sebelum showModal */
          >
            Register
          </button>
        </form>
        {loader && <p className="text-black">Loading...</p>}
      </div>
    </div>
  );
};

export default RegisterPage;
