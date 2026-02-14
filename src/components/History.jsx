import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Waves, PersonStanding } from "lucide-react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { capFirst } from "../utils/strings";

function normType(t) {
  return (t || "swim").toLowerCase() === "run" ? "run" : "swim";
}

function TypeBadge({ type }) {
  const isRun = normType(type) === "run";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium ring-1
      ${
        isRun
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20"
          : "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20"
      }`}
      title={isRun ? "Running" : "Natation"}
    >
      {isRun ? <PersonStanding size={14} /> : <Waves size={14} />}
      <span>{isRun ? "Running" : "Natation"}</span>
    </span>
  );
}

function TypeSelect({ value, onChange }) {
  const v = normType(value);
  return (
    <select
      value={v}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-[7.5rem] sm:w-[6.5rem] rounded-lg border border-slate-300 bg-white px-2 py-1 text-[16px] sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
    >
      <option value="swim">Natation</option>
      <option value="run">Running</option>
    </select>
  );
}

export function History({ sessions, onDelete, onEdit, readOnly }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const [editType, setEditType] = useState("swim");

  const perPage = 10;
  const formatDesktopDate = (value) => {
    const formatted = dayjs(value).locale("fr").format("D MMMM YYYY");
    const parts = formatted.split(" ");
    if (parts.length < 3) return formatted;
    const [day, month, year] = parts;
    return `${day} ${capFirst(month)} ${year}`;
  };
  const formatMobileDate = (value) => formatDesktopDate(value);

  useEffect(() => {
    setPage(1);
  }, [sessions]);

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sessions]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentData = sorted.slice((page - 1) * perPage, page * perPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startEdit = (s) => {
    if (readOnly) return;
    setEditId(s.id);
    setEditDate(s.date);
    setEditDistance(String(s.distance ?? ""));
    setEditType(normType(s.type));
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const distNum = Number(editDistance);
    if (!Number.isFinite(distNum) || distNum <= 0) return;
    await onEdit(editId, {
      date: editDate,
      distance: distNum,
      type: normType(editType),
    });
    setEditId(null);
  };

  if (!sessions.length) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aucune séance enregistrée.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/50 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="p-0 sm:p-4">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {currentData.map((s) => {
            const isEditing = editId === s.id;
            return (
              <div key={s.id} className="px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-[9.5rem] rounded-lg border border-slate-300 bg-white px-2 py-1 text-[16px] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      formatMobileDate(s.date)
                    )}
                  </div>
                  <div>
                    {isEditing ? (
                      <TypeSelect value={editType} onChange={setEditType} />
                    ) : (
                      <TypeBadge type={s.type} />
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Distance</div>
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editDistance}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d+$/.test(value)) {
                            setEditDistance(value);
                          }
                        }}
                        min="0"
                        step="1"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[16px] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      `${s.distance} m`
                    )}
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-1.5 text-white hover:bg-emerald-500"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-500 px-2 py-1.5 text-white hover:bg-slate-400"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        disabled={readOnly}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white ${
                          readOnly ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                        }`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => !readOnly && onDelete(s.id)}
                        disabled={readOnly}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white ${
                          readOnly ? "bg-slate-400 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-500"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <table className="hidden sm:table w-full table-fixed text-left text-slate-900 dark:text-slate-100">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              <th className="px-2 sm:px-4 py-3 w-[7rem]">Date</th>
              <th className="px-2 sm:px-4 py-3 w-[5rem]">Type</th>
              <th className="px-2 sm:px-4 py-3 w-[6rem]">Distance</th>
              <th className="px-2 sm:px-4 py-3 text-right w-[4.5rem]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentData.map((s) => {
              const isEditing = editId === s.id;

              return (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  {/* Date */}
                  <td className="px-2 sm:px-4 py-3">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-[6rem] sm:w-auto rounded-lg border border-slate-300 bg-white px-2 py-1 text-[16px] sm:text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {formatDesktopDate(s.date)}
                        </span>
                        <span className="sm:hidden">
                          {formatMobileDate(s.date)}
                        </span>
                      </>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-2 sm:px-4 py-3">
                    {isEditing ? (
                      <TypeSelect value={editType} onChange={setEditType} />
                    ) : (
                      <TypeBadge type={s.type} />
                    )}
                  </td>

                  {/* Distance */}
                  <td className="px-2 sm:px-4 py-3 font-semibold">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editDistance}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d+$/.test(value)) {
                            setEditDistance(value);
                          }
                        }}
                        min="0"
                        step="1"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-20 sm:w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[16px] sm:text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    ) : (
                      `${s.distance} m`
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-2 sm:px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="inline-flex gap-1 sm:gap-2">
                        {/* Sauver */}
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-1.5 py-1 sm:px-2 sm:py-1.5 text-white hover:bg-emerald-500"
                        >
                          <Check size={16} />
                        </button>

                        {/* Annuler */}
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-500 px-1.5 py-1 sm:px-2 sm:py-1.5 text-white hover:bg-slate-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-1 sm:gap-2">
                        {/* Modifier */}
                        <button
                          onClick={() => startEdit(s)}
                          disabled={readOnly}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 text-white ${
                            readOnly
                              ? "bg-slate-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-500"
                          }`}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Supprimer */}
                        <button
                          onClick={() => !readOnly && onDelete(s.id)}
                          disabled={readOnly}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 text-white ${
                            readOnly
                              ? "bg-slate-400 cursor-not-allowed"
                              : "bg-rose-600 hover:bg-rose-500"
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            ◀ Précédent
          </button>

          <span className="text-sm">
            Page <span className="font-semibold">{page}</span> sur{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>

          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1 font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            Suivant ▶
          </button>
        </div>
      </div>
    </div>
  );
}
