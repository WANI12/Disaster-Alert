import React from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import SubmitAlertPage from "./pages/SubmitAlertPage.tsx";
import SubmitReportPage from "./pages/SubmitReportPage.tsx";

export default function App() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-indigo-300" : "text-slate-300 hover:text-white";

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/40 flex items-center justify-center">
              <span className="text-indigo-200 font-bold">DA</span>
            </div>
            <div className="leading-tight">
              <div className="text-white font-semibold">Disaster Alert</div>
              <div className="text-xs text-slate-400">Dashboard + Early Warning</div>
            </div>
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <NavLink to="/" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/submit-alert" className={linkClass}>
              Report Incident
            </NavLink>
            <NavLink to="/submit-report" className={linkClass}>
              Submit Report
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Register
            </NavLink>
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/submit-alert" element={<SubmitAlertPage />} />
          <Route path="/submit-report" element={<SubmitReportPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="*"
            element={
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
                Page not found.{" "}
                <Link to="/" className="text-indigo-300 hover:text-white">
                  Go back
                </Link>
                .
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

