import React from "react";

export function PullToRefreshOverlay({ show }) {
  return (
    <>
      <style>{`
        @keyframes orbit-spin-mini {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes opacity-pulse-mini {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(3.2); }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center transition-[opacity,transform] duration-400 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.98)",
        }}
      >
        <div
          className="absolute inset-0 bg-white/10 backdrop-blur-[2px] transition-opacity duration-400 ease-out dark:bg-slate-900/10"
          style={{ opacity: show ? 1 : 0 }}
        />
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-white/70 blur-xl transition-opacity duration-400 ease-out dark:bg-slate-900/40"
            style={{ opacity: show ? 1 : 0 }}
          />
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/apple-touch-icon.png"
                alt="NaTrack"
                className="h-24 w-24"
                style={{ opacity: show ? 1 : 0, transition: "opacity 400ms ease-out" }}
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ transform: "scaleY(0.8) rotate(-75deg)", transformOrigin: "center" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  animation: "orbit-spin-mini 1.2s linear infinite reverse",
                  opacity: show ? 1 : 0,
                  transition: "opacity 400ms ease-out",
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[3px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                  style={{ animation: "opacity-pulse-mini 1.2s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
