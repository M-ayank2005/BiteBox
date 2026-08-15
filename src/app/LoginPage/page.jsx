'use client';
import React from "react";
import AuthForm from "../../Components/AuthForm";
import { useDarkMode } from "../DarkModeContext";

const LoginPage = () => {
  const { darkMode } = useDarkMode();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      {/* Logo / Brand Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Welcome to <span className="text-amber-500">BiteBox</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Sign in to access your account
        </p>
      </div>

      {/* Auth Form Container */}
      <div className="w-full max-w-md glass-panel p-8 space-y-6">
        <AuthForm />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-slate-400 dark:text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} BiteBox. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;