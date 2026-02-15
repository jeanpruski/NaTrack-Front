import React, { useEffect, useState } from "react";
import { AddSessionForm } from "../components/AddSessionForm";
import { History } from "../components/History";
import { HEADER_SURFACE_CLASS, HEADER_TOP_PADDING_STYLE } from "../constants/layout";

export function EditModal({
  open,
  onClose,
  isBusy,
  isAuth,
  verifyAndLogin,
  logout,
  sessions,
  readOnly = false,
  targetName,
  loggedUserName,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onImport,
  isAdmin,
  initialTab = "options",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("options"); // options | history

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setErr("");
      setTab("options");
      return;
    }
    setTab(initialTab || "options");
  }, [open, initialTab]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await verifyAndLogin({ email, password });
    } catch {
      setErr("Identifiants invalides");
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50" onClick={handleClose}>
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-md pointer-events-none"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`flex w-full flex-col ${
            isAuth
              ? "max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
              : "max-w-md"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`${
              isAuth
                ? "flex-1 overflow-auto px-4 pb-10 pt-6 sm:px-6 sm:pb-10 sm:pt-6"
                : ""
            }`}
          >
            {!isAuth ? (
              <form onSubmit={submit} className="mx-auto w-full">
                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 overflow-hidden">
                  <div className="h-2 w-full bg-gradient-to-r from-emerald-300/70 via-lime-300/60 to-sky-400/50" />
                  <div className="px-5 py-6">
                    <div className="mb-5 flex flex-col items-center gap-3 text-center">
                      <img src="/big-logo.png" alt="NaTrack" className="h-12 w-auto" />
                      <div className="sr-only">Connexion</div>
                    </div>
                    <div className="text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Connecte-toi pour continuer.
                    </div>
                    <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                      Pas encore de compte ? Contacte l’équipe.
                      <br />
                      Cette version est encore en alpha.
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-0 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        type="password"
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-0 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                    {err && (
                      <div className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                        {err}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="mt-4 w-full rounded-xl bg-emerald-500/90 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                    >
                      Déverrouiller
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mx-auto w-full max-w-5xl">
                {targetName && (
                  <div className="mb-4 rounded-2xl bg-slate-50/80 px-4 py-2 text-center text-sm font-semibold text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700">
                    {targetName}
                  </div>
                )}
                <div className="mb-4 flex items-center justify-between gap-2">
                  {isAuth && (
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
                      <button
                        onClick={() => setTab("options")}
                        disabled={isBusy}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          tab === "options"
                            ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                            : "text-slate-600 dark:text-slate-300"
                        } ${isBusy ? disabledCls : ""}`}
                      >
                        Options
                      </button>
                      <button
                        onClick={() => setTab("history")}
                        disabled={isBusy}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          tab === "history"
                            ? "bg-white shadow text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                            : "text-slate-600 dark:text-slate-300"
                        } ${isBusy ? disabledCls : ""}`}
                      >
                        Historique
                      </button>
                    </div>
                  )}
                  {isAuth && (
                    <button
                      onClick={logout}
                      disabled={isBusy}
                      className={`rounded-xl bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-500 ${
                        isBusy ? disabledCls : ""
                      }`}
                      title="Repasser en lecture seule"
                    >
                      🔒{" "}
                      <span className="sm:inline">
                        {loggedUserName ? ` ${loggedUserName}` : ""}
                      </span>
                    </button>
                  )}
                </div>
                {tab === "options" ? (
                  <div className="relative">
                    <div className={readOnly ? "blur-sm pointer-events-none" : ""}>
                      <AddSessionForm
                        onAdd={onAdd}
                        onExport={onExport}
                        onImport={onImport}
                        readOnly={isBusy || readOnly}
                        isAdmin={isAdmin}
                      />
                    </div>
                    {readOnly && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow ring-1 ring-slate-200 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-slate-700">
                          Options en lecture seule
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <History sessions={sessions} onDelete={onDelete} onEdit={onEdit} readOnly={isBusy || readOnly} />
                )}
              </div>
            )}
          </div>

          {isBusy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <style>{`
                @keyframes orbit-spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes opacity-pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.6; }
                }
              `}</style>
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/apple-touch-icon.png" alt="NaTrack" className="w-24 h-24" />
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{ transform: "scaleY(0.7) rotate(-45deg)", transformOrigin: "center" }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ animation: "orbit-spin 1.4s linear infinite reverse" }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 h-3 w-3 rounded-full blur-[1px] bg-gradient-to-r from-indigo-500 to-emerald-500 dark:from-indigo-300 dark:to-emerald-300"
                        style={{ animation: "opacity-pulse 1.5s ease-in-out infinite" }}
                      />
                    </div>
                  </div>
                </div>
                <span className="sr-only">Chargement…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
