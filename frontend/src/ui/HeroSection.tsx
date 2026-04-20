import React from "react";
import { MapPin, AlertTriangle, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">
              South Sudan Hazards Watch
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Monitor Disasters in South Sudan
          </h1>

          <p className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
            The South Sudan Hazards Watch enables real-time monitoring of extreme events—including droughts, floods,
            conflicts, disease outbreaks, and crop failures—that impact communities across the nation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#map"
              className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition group"
            >
              Explore Map
              <Zap className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
            </a>
            <a
              href="#alerts"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              View Active Alerts
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
