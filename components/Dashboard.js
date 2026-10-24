"use client";

import { useEffect, useState } from "react";

const STATUSES = ["New", "In Progress", "Resolved"];

export default function Dashboard() {
  const [filter, setFilter] = useState(""); // "" = all
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null); // row currently being updated

  // Load from the server whenever the filter changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const url = filter
          ? `/api/enquiries?status=${encodeURIComponent(filter)}`
          : "/api/enquiries";
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load enquiries.");
        if (!cancelled) setRows(data.enquiries);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load enquiries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true; // ignore a stale response if the filter changed again
    };
  }, [filter]);

  // Replace one row with the server's updated version (or drop it if it no longer matches the filter)
  function applyUpdate(updated) {
    setRows((current) =>
      current
        .map((r) => (r.id === updated.id ? updated : r))
        .filter((r) => !filter || r.status === filter)
    );
  }

  async function changeStatus(id, status) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update status.");
      applyUpdate(data.enquiry);
    } catch (err) {
      setError(err.message || "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function retry(id) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/enquiries/${id}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not retry categorization.");
      applyUpdate(data.enquiry);
    } catch (err) {
      setError(err.message || "Could not retry categorization.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <label htmlFor="filter">Filter by status</label>
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="banner error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted">No enquiries found.</p>
      )}

      {rows.map((e) => {
        const expanded = expandedId === e.id;
        const long = e.message.length > 120;
        return (
          <div className="card" key={e.id}>
            <div className="row-head">
              <strong>{e.name}</strong>
              <span className="muted">{e.email}</span>
              <span className="muted">{new Date(e.createdAt).toLocaleString()}</span>
            </div>

            <p className="message">
              {expanded || !long ? e.message : e.message.slice(0, 120) + "..."}
            </p>
            {long && (
              <button className="link" onClick={() => setExpandedId(expanded ? null : e.id)}>
                {expanded ? "Hide full message" : "View full message"}
              </button>
            )}

            <div className="row-foot">
              <span className="badge">Category: {e.category ?? "Not categorized"}</span>
              <span className={`badge state-${e.categorizationState.toLowerCase()}`}>
                AI: {e.categorizationState}
              </span>

              <select
                aria-label={`Status for ${e.name}`}
                value={e.status}
                disabled={busyId === e.id}
                onChange={(ev) => changeStatus(e.id, ev.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {e.categorizationState === "Failed" && (
                <button disabled={busyId === e.id} onClick={() => retry(e.id)}>
                  {busyId === e.id ? "Retrying..." : "Retry categorization"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}