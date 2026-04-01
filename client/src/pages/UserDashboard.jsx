import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

/* ─── helpers ─── */
const PRIORITY_COLOR = {
  Low:    { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399" },
  Medium: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "#fbbf24" },
  High:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   text: "#ef4444" },
};
const STATUS_COLOR = {
  Pending:      { bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
  "In Progress":{ bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.4)", text: "#818cf8" },
  Completed:    { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)", text: "#34d399" },
};

function Badge({ label, colorMap }) {
  const c = colorMap[label] || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", text: "#94a3b8" };
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap", display: "inline-block",
    }}>{label}</span>
  );
}

function DeadlinePill({ dueDate }) {
  if (!dueDate) return <span style={{ fontSize: 11, color: "#2e3348" }}>No deadline</span>;
  const due   = new Date(dueDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff  = Math.ceil((due - today) / 86400000);
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  let color   = "#5a6070";
  if (diff < 0)  color = "#ef4444";
  else if (diff <= 2) color = "#f59e0b";
  else if (diff <= 7) color = "#fbbf24";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, color, fontWeight: 500,
    }}>
      <svg width="12" height="12" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/>
      </svg>
      {diff < 0 ? `Overdue · ${label}` : diff === 0 ? `Due today · ${label}` : `Due ${label}`}
    </span>
  );
}

export default function UserDashboard() {
  const navigate  = useNavigate();
  const user      = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  /* ── state ── */
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchErr,    setFetchErr]    = useState("");
  const [activeFilter,setFilter]      = useState("All");
  const [toast,       setToast]       = useState(null);
  const [submitModal, setSubmitModal] = useState(null); // task object
  const [subLink,     setSubLink]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [subErr,      setSubErr]      = useState("");

  /* ── stats ── */
  const total      = tasks.length;
  const completed  = tasks.filter(t => t.status === "Completed").length;
  const pending    = tasks.filter(t => t.status === "Pending").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── fetch user's assigned tasks ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true); setFetchErr("");
    try {
      const res = await API.get("/api/tasks/user-tasks");
      setTasks(res.data.tasks ?? res.data);
    } catch (err) {
      setFetchErr(err.response?.data?.message || "Failed to fetch your tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchTasks();
  }, []);

  /* ── submit task link ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubErr("");
    if (!subLink.trim()) { setSubErr("Submission link is required."); return; }
    setSubmitting(true);
    try {
      await API.post("/api/submissions/submit-task", {
        taskId: submitModal._id,
        submissionLink: subLink.trim(),
      });
      showToast("Submission sent ✓");
      setSubmitModal(null);
      setSubLink("");
    } catch (err) {
      setSubErr(err.response?.data?.msg || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filtered = activeFilter === "All" ? tasks : tasks.filter(t => t.status === activeFilter);

  /* ─────────────────── JSX ─────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ud-root {
          min-height: 100vh;
          background: #080810;
          font-family: 'DM Sans', sans-serif;
          color: #e2e0f0;
        }

        /* ── TOPBAR ── */
        .ud-topbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px; height: 64px;
          background: rgba(8,8,16,0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ud-brand { display: flex; align-items: center; gap: 10px; }
        .ud-brand-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,136,46,0.12));
          border: 1px solid rgba(212,175,55,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .ud-brand-mark svg { width: 16px; height: 16px; stroke: #d4af37; }
        .ud-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px; color: #e8e0cc; letter-spacing: 0.02em;
        }
        .ud-brand-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #d4af37;
          background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.25);
          padding: 2px 7px; border-radius: 20px; margin-left: 4px;
        }
        .ud-topbar-right { display: flex; align-items: center; gap: 14px; }
        .ud-user-chip {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 5px 14px 5px 6px;
        }
        .ud-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #0b0b0f;
        }
        .ud-user-name { font-size: 13px; color: #94a0b8; }
        .ud-logout-btn {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22);
          color: #f87171; font-size: 12px; font-weight: 500;
          padding: 6px 15px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s; letter-spacing: 0.03em;
        }
        .ud-logout-btn:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
        .ud-dashboard-btn {
          background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.25);
          color: #d4af37; font-size: 12px; font-weight: 500;
          padding: 6px 15px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s; letter-spacing: 0.03em;
        }
        .ud-dashboard-btn:hover { background: rgba(212,175,55,0.2); color: #e8c84a; }

        /* ── BODY ── */
        .ud-body { max-width: 960px; margin: 0 auto; padding: 44px 24px 90px; }

        /* ── PAGE HEADER ── */
        .ud-page-header { margin-bottom: 40px; }
        .ud-eyebrow {
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          color: #d4af37; font-weight: 600; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ud-eyebrow::before {
          content: ''; display: inline-block;
          width: 18px; height: 1px; background: rgba(212,175,55,0.5);
        }
        .ud-page-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.7rem, 3vw, 2.2rem); color: #f0ebe0; font-weight: 500;
          margin-bottom: 8px;
        }
        .ud-page-sub { font-size: 14px; color: #424759; font-weight: 300; line-height: 1.6; }
        .ud-welcome-name { color: #d4af37; }

        /* ── STATS ROW ── */
        .ud-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 36px;
        }
        .ud-stat {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 14px; padding: 18px 20px;
          position: relative; overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .ud-stat:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.35); border-color: rgba(255,255,255,0.12); }
        .ud-stat::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 14px 14px 0 0;
        }
        .ud-stat.total::before  { background: linear-gradient(90deg, #d4af37, #b8882e); }
        .ud-stat.done::before   { background: linear-gradient(90deg, #34d399, #059669); }
        .ud-stat.waiting::before{ background: linear-gradient(90deg, #94a3b8, #64748b); }
        .ud-stat.active::before { background: linear-gradient(90deg, #818cf8, #6366f1); }
        .ud-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.1rem; font-weight: 500; line-height: 1; margin-bottom: 4px;
        }
        .ud-stat.total  .ud-stat-num { color: #d4af37; }
        .ud-stat.done   .ud-stat-num { color: #34d399; }
        .ud-stat.waiting .ud-stat-num{ color: #94a3b8; }
        .ud-stat.active .ud-stat-num { color: #818cf8; }
        .ud-stat-label { font-size: 11.5px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #2e3348; }

        /* ── FILTERS ── */
        .ud-filter-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .ud-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .ud-pill {
          font-size: 11.5px; font-weight: 500; letter-spacing: 0.04em;
          padding: 5px 14px; border-radius: 20px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); color: #3d4258;
          font-family: 'DM Sans', sans-serif; transition: all 0.18s;
        }
        .ud-pill:hover { color: #94a0b8; border-color: rgba(255,255,255,0.13); }
        .ud-pill.active {
          background: rgba(212,175,55,0.12);
          border-color: rgba(212,175,55,0.35); color: #d4af37;
        }
        .ud-task-count {
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #2e3348; font-weight: 500;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          padding: 4px 12px; border-radius: 20px;
        }

        /* ── TASK GRID ── */
        .ud-task-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        /* ── TASK CARD ── */
        .ud-task-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 16px; padding: 22px;
          display: flex; flex-direction: column; gap: 14px;
          transition: border-color 0.22s, background 0.22s, transform 0.22s, box-shadow 0.22s;
          position: relative; overflow: hidden;
        }
        .ud-task-card:hover {
          border-color: rgba(212,175,55,0.22);
          background: rgba(255,255,255,0.038);
          transform: translateY(-3px);
          box-shadow: 0 18px 48px rgba(0,0,0,0.4);
        }
        .ud-task-card.is-done {
          opacity: 0.62;
        }
        .ud-task-card::after {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; border-radius: 16px 0 0 16px;
          background: transparent;
          transition: background 0.22s;
        }
        .ud-task-card:hover::after { background: linear-gradient(180deg, #d4af37, #b8882e); }
        .ud-task-card.is-done::after { background: rgba(52,211,153,0.5) !important; }

        .ud-task-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .ud-task-title {
          font-size: 15px; font-weight: 600; color: #d8d4ee; line-height: 1.4;
          flex: 1;
        }
        .ud-task-card.is-done .ud-task-title {
          text-decoration: line-through; text-decoration-color: rgba(255,255,255,0.18);
        }
        .ud-task-desc {
          font-size: 13px; color: #454b62; line-height: 1.65;
          display: -webkit-box; -webkit-line-clamp: 3;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .ud-task-meta { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
        .ud-task-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; }
        .ud-submit-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,136,46,0.12));
          border: 1px solid rgba(212,175,55,0.3);
          color: #d4af37; font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em;
          padding: 6px 14px; border-radius: 9px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
          white-space: nowrap;
        }
        .ud-submit-btn:hover { background: rgba(212,175,55,0.28); border-color: rgba(212,175,55,0.5); color: #e8c84a; }
        .ud-submit-btn svg { flex-shrink: 0; }

        /* ── ASSIGNED BY ── */
        .ud-assigned-by {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; color: "#2a2f42";
        }
        .ud-assigned-by-dot {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: #94a0b8;
        }

        /* ── EMPTY STATE ── */
        .ud-empty {
          text-align: center; padding: 72px 24px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.07);
          border-radius: 18px;
        }
        .ud-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .ud-empty-icon svg { width: 24px; height: 24px; stroke: #d4af37; opacity: 0.5; }
        .ud-empty-title { font-size: 16px; font-weight: 600; color: #2e3348; margin-bottom: 6px; }
        .ud-empty-sub { font-size: 13.5px; color: "#1e2234"; }

        /* ── LOADER ── */
        .ud-loader { text-align: center; padding: 80px 0; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── MODAL ── */
        .ud-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(4,4,12,0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fade-in 0.18s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .ud-modal {
          background: #10111e; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; width: 100%; max-width: 440px; overflow: hidden;
          animation: modal-up 0.22s cubic-bezier(.2,.8,.4,1);
        }
        @keyframes modal-up { from { opacity:0; transform: scale(0.95) translateY(10px); } to { opacity:1; transform: none; } }
        .ud-modal-header {
          padding: 22px 24px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: space-between;
        }
        .ud-modal-title { font-size: 15px; font-weight: 600; color: #d0cce8; }
        .ud-modal-close {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); cursor: pointer; color: #5a6070;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .ud-modal-close:hover { background: rgba(255,255,255,0.09); color: #94a0b8; }
        .ud-modal-body { padding: 22px 24px; }
        .ud-modal-task-name {
          font-size: 13.5px; color: #d4af37; font-weight: 500; margin-bottom: 18px;
          padding: 9px 14px; background: rgba(212,175,55,0.07);
          border: 1px solid rgba(212,175,55,0.15); border-radius: 9px;
        }
        .ud-modal-label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #3d4258; margin-bottom: 7px;
        }
        .ud-modal-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 9px; padding: 11px 14px;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          color: #e2e0f0; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ud-modal-input::placeholder { color: "#1e2234"; }
        .ud-modal-input:focus {
          border-color: rgba(212,175,55,0.5);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
        }
        .ud-modal-err {
          margin-top: 10px; font-size: 12.5px;
          color: #f87171; display: flex; align-items: center; gap: 6px;
        }
        .ud-modal-footer { padding: 0 24px 24px; display: flex; gap: 10px; }
        .ud-btn-cancel {
          flex: 1; padding: 11px; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #5a6070; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .ud-btn-cancel:hover { background: rgba(255,255,255,0.09); color: #94a0b8; }
        .ud-btn-send {
          flex: 2; padding: 11px; border-radius: 9px;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          border: none; color: #0b0b0f;
          font-size: 13px; font-weight: 700; letter-spacing: 0.03em;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .ud-btn-send:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .ud-btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── TOAST ── */
        .ud-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 300;
          padding: 12px 18px; border-radius: 11px;
          font-size: 13.5px; font-weight: 500;
          display: flex; align-items: center; gap: 9px;
          animation: slide-up 0.25s ease;
          box-shadow: 0 10px 40px rgba(0,0,0,0.55);
        }
        @keyframes slide-up { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        .ud-toast.success { background: rgba(52,211,153,0.18); border: 1px solid rgba(52,211,153,0.35); color: #34d399; }
        .ud-toast.error   { background: rgba(239,68,68,0.18);  border: 1px solid rgba(239,68,68,0.35);  color: #f87171; }

        /* ── ERROR BANNER ── */
        .ud-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 18px; color: #f87171; font-size: 13.5px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 700px) {
          .ud-topbar { padding: 0 18px; }
          .ud-body { padding: 28px 14px 70px; }
          .ud-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .ud-task-grid { grid-template-columns: 1fr; }
          .ud-brand-badge { display: none; }
        }
      `}</style>

      <div className="ud-root">
        {/* ── Topbar ── */}
        <div className="ud-topbar">
          <div className="ud-brand">
            <div className="ud-brand-mark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="ud-brand-name">Talent Management System</span>
            <span className="ud-brand-badge">My Dashboard</span>
          </div>

          <div className="ud-topbar-right">
            <button
              id="admin-dashboard-btn"
              className="ud-dashboard-btn"
              onClick={() => navigate("/dashboard")}
            >
              Admin View
            </button>
            {user && (
              <div className="ud-user-chip">
                <div className="ud-avatar">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="ud-user-name">{user.name || user.email}</span>
              </div>
            )}
            <button id="user-logout-btn" className="ud-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ud-body">
          {/* Page header */}
          <div className="ud-page-header">
            <p className="ud-eyebrow">My Workspace</p>
            <h1 className="ud-page-title">
              Welcome back{user?.name ? ", " : ""}<span className="ud-welcome-name">{user?.name || ""}</span>
            </h1>
            <p className="ud-page-sub">
              Here are the tasks assigned to you. Submit your work using the links below.
            </p>
          </div>

          {/* Stats */}
          <div className="ud-stats">
            <div className="ud-stat total">
              <div className="ud-stat-num">{total}</div>
              <div className="ud-stat-label">Assigned</div>
            </div>
            <div className="ud-stat done">
              <div className="ud-stat-num">{completed}</div>
              <div className="ud-stat-label">Completed</div>
            </div>
            <div className="ud-stat waiting">
              <div className="ud-stat-num">{pending}</div>
              <div className="ud-stat-label">Pending</div>
            </div>
            <div className="ud-stat active">
              <div className="ud-stat-num">{inProgress}</div>
              <div className="ud-stat-label">In Progress</div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="ud-filter-row">
            <div className="ud-filter-pills">
              {["All", "Pending", "In Progress", "Completed"].map(f => (
                <button
                  key={f}
                  id={`ud-filter-${f.replace(" ", "-").toLowerCase()}`}
                  className={`ud-pill${activeFilter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
            <span className="ud-task-count">{filtered.length} / {total} tasks</span>
          </div>

          {/* Task Grid */}
          {loading ? (
            <div className="ud-loader">
              <svg className="spin" width="28" height="28" fill="none" stroke="#d4af37" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              <p style={{ marginTop: 14, fontSize: 13, color: "#2e3348" }}>Loading your tasks…</p>
            </div>
          ) : fetchErr ? (
            <div className="ud-error">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
              </svg>
              {fetchErr}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ud-empty">
              <div className="ud-empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="ud-empty-title">
                {tasks.length === 0 ? "No tasks assigned yet" : `No ${activeFilter} tasks`}
              </p>
              <p className="ud-empty-sub">
                {tasks.length === 0
                  ? "Your manager will assign tasks to you soon."
                  : "Try a different filter to see other tasks."}
              </p>
            </div>
          ) : (
            <div className="ud-task-grid">
              {filtered.map(task => (
                <div
                  key={task._id}
                  className={`ud-task-card${task.status === "Completed" ? " is-done" : ""}`}
                  id={`ud-task-${task._id}`}
                >
                  {/* Top: title + priority badge */}
                  <div className="ud-task-top">
                    <div className="ud-task-title">{task.title}</div>
                    <Badge label={task.priority || "Medium"} colorMap={PRIORITY_COLOR} />
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="ud-task-desc">{task.description}</p>
                  )}

                  {/* Meta row: status + deadline */}
                  <div className="ud-task-meta">
                    <Badge label={task.status || "Pending"} colorMap={STATUS_COLOR} />
                    <DeadlinePill dueDate={task.dueDate} />
                  </div>

                  {/* Assigned by */}
                  {task.createdBy && (
                    <div className="ud-assigned-by" style={{ fontSize: 11, color: "#2a2f42", display: "flex", alignItems: "center", gap: 5 }}>
                      <div className="ud-assigned-by-dot">
                        {(task.createdBy.name || task.createdBy.email || "?")[0].toUpperCase()}
                      </div>
                      <span>Assigned by {task.createdBy.name || task.createdBy.email}</span>
                    </div>
                  )}

                  {/* Footer: submit button */}
                  <div className="ud-task-footer">
                    <button
                      id={`submit-task-${task._id}`}
                      className="ud-submit-btn"
                      onClick={() => { setSubmitModal(task); setSubLink(""); setSubErr(""); }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Submit Work
                    </button>
                    <span style={{ fontSize: 10.5, color: "#2a2f42" }}>
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Submit Modal ── */}
      {submitModal && (
        <div
          className="ud-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSubmitModal(null); }}
        >
          <div className="ud-modal">
            <div className="ud-modal-header">
              <span className="ud-modal-title">Submit Your Work</span>
              <button className="ud-modal-close" onClick={() => setSubmitModal(null)} aria-label="Close">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ud-modal-body">
                <div className="ud-modal-task-name">📋 {submitModal.title}</div>
                <label className="ud-modal-label" htmlFor="submission-link">Submission Link</label>
                <input
                  id="submission-link"
                  className="ud-modal-input"
                  type="url"
                  placeholder="https://github.com/your-repo or drive link…"
                  value={subLink}
                  onChange={(e) => { setSubLink(e.target.value); setSubErr(""); }}
                  autoFocus
                />
                {subErr && (
                  <div className="ud-modal-err">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                    </svg>
                    {subErr}
                  </div>
                )}
              </div>
              <div className="ud-modal-footer">
                <button type="button" className="ud-btn-cancel" onClick={() => setSubmitModal(null)}>Cancel</button>
                <button id="confirm-submit-btn" type="submit" className="ud-btn-send" disabled={submitting}>
                  {submitting ? (
                    <>
                      <svg className="spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Send Submission
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`ud-toast ${toast.type}`}>
          {toast.type === "success" ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </>
  );
}
