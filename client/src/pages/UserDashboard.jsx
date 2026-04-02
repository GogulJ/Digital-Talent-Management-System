import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

/* ─────────── colour maps ─────────── */
const PRIORITY_COLOR = {
  Low:    { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399" },
  Medium: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "#fbbf24" },
  High:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   text: "#ef4444" },
};
const TASK_STATUS_COLOR = {
  Pending:       { bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
  "In Progress": { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.4)", text: "#818cf8" },
  Completed:     { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)", text: "#34d399" },
};
const SUB_STATUS_COLOR = {
  Submitted: { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#60a5fa" },
  Reviewed:  { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "#fbbf24" },
  Approved:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399" },
  Rejected:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   text: "#ef4444" },
};

/* ─────────── tiny components ─────────── */
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
  const due = new Date(dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.ceil((due - today) / 86400000);
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const color = diff < 0 ? "#ef4444" : diff <= 2 ? "#f59e0b" : diff <= 7 ? "#fbbf24" : "#5a6070";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color, fontWeight: 500 }}>
      <svg width="12" height="12" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      {diff < 0 ? `Overdue · ${label}` : diff === 0 ? `Due today · ${label}` : `Due ${label}`}
    </span>
  );
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function UserDashboard() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  /* ── core data ── */
  const [tasks,        setTasks]        = useState([]);
  const [submittedMap, setSubmittedMap] = useState({}); // { taskId: submission }
  const [loading,      setLoading]      = useState(true);
  const [fetchErr,     setFetchErr]     = useState("");

  /* ── UI state ── */
  const [activeFilter, setFilter]       = useState("All");
  const [toast,        setToast]        = useState(null);

  /* ── modal state ── */
  const [submitModal,  setSubmitModal]  = useState(null); // task object
  const [subLink,      setSubLink]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [subErr,       setSubErr]       = useState("");

  /* ── stats ── */
  const total       = tasks.length;
  const completed   = tasks.filter(t => t.status === "Completed").length;
  const pending     = tasks.filter(t => t.status === "Pending").length;
  const inProgress  = tasks.filter(t => t.status === "In Progress").length;
  const submitted   = Object.keys(submittedMap).length;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── fetch tasks AND submissions in parallel ── */
  const fetchAll = useCallback(async () => {
    setLoading(true); setFetchErr("");
    try {
      const [taskRes, subRes] = await Promise.all([
        API.get("/api/tasks/user-tasks"),
        API.get("/api/submissions/my"),
      ]);
      const taskList = taskRes.data.tasks ?? taskRes.data;
      setTasks(taskList);

      // build map: taskId (string) → submission object
      const subs = subRes.data ?? [];
      const map = {};
      subs.forEach(s => {
        const tid = s.taskId?._id ?? s.taskId;
        if (tid) map[String(tid)] = s;
      });
      setSubmittedMap(map);
    } catch (err) {
      setFetchErr(err.response?.data?.message || "Failed to load your workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchAll();
  }, []);

  /* ── open submit modal ── */
  const openModal = (task) => {
    const existing = submittedMap[String(task._id)];
    setSubmitModal(task);
    setSubLink(existing?.submissionLink || "");
    setSubErr("");
  };

  /* ── submit / re-submit handler ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubErr("");
    if (!subLink.trim()) { setSubErr("A submission link is required."); return; }
    try { new URL(subLink.trim()); } catch { setSubErr("Please enter a valid URL (https://…)."); return; }
    setSubmitting(true);
    try {
      await API.post("/api/submissions/submit-task", {
        taskId: submitModal._id,
        submissionLink: subLink.trim(),
      });
      const isResubmit = !!submittedMap[String(submitModal._id)];
      showToast(isResubmit ? "Re-submission sent ✓" : "Submission sent ✓");
      setSubmitModal(null);
      setSubLink("");
      // refresh submissions to reflect latest state
      const subRes = await API.get("/api/submissions/my");
      const subs = subRes.data ?? [];
      const map = {};
      subs.forEach(s => { const tid = s.taskId?._id ?? s.taskId; if (tid) map[String(tid)] = s; });
      setSubmittedMap(map);
    } catch (err) {
      setSubErr(err.response?.data?.msg || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ── filter logic ── */
  const filtered = (() => {
    if (activeFilter === "Submitted") return tasks.filter(t => !!submittedMap[String(t._id)]);
    if (activeFilter === "Not Submitted") return tasks.filter(t => !submittedMap[String(t._id)]);
    if (activeFilter === "All") return tasks;
    return tasks.filter(t => t.status === activeFilter);
  })();

  /* ══════════════════ JSX ══════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ud-root { min-height: 100vh; background: #080810; font-family: 'DM Sans', sans-serif; color: #e2e0f0; }

        /* ── TOPBAR ── */
        .ud-topbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px; height: 64px;
          background: rgba(8,8,16,0.9); backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ud-brand { display: flex; align-items: center; gap: 10px; }
        .ud-brand-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg,rgba(212,175,55,0.18),rgba(184,136,46,0.12));
          border: 1px solid rgba(212,175,55,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .ud-brand-mark svg { width: 16px; height: 16px; stroke: #d4af37; }
        .ud-brand-name { font-family:'Playfair Display',serif; font-size:16px; color:#e8e0cc; letter-spacing:0.02em; }
        .ud-brand-badge {
          font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;
          color:#d4af37; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25);
          padding:2px 7px; border-radius:20px; margin-left:4px;
        }
        .ud-topbar-right { display:flex; align-items:center; gap:12px; }
        .ud-user-chip {
          display:flex; align-items:center; gap:8px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
          border-radius:100px; padding:5px 14px 5px 6px;
        }
        .ud-avatar {
          width:28px; height:28px; border-radius:50%;
          background:linear-gradient(135deg,#d4af37,#b8882e);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; color:#0b0b0f;
        }
        .ud-user-name { font-size:13px; color:#94a0b8; }
        .ud-logout-btn {
          background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.22);
          color:#f87171; font-size:12px; font-weight:500; padding:6px 15px;
          border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.2s; letter-spacing:0.03em;
        }
        .ud-logout-btn:hover { background:rgba(239,68,68,0.2); color:#fca5a5; }
        .ud-admin-btn {
          background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25);
          color:#d4af37; font-size:12px; font-weight:500; padding:6px 15px;
          border-radius:8px; cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all 0.2s; letter-spacing:0.03em;
        }
        .ud-admin-btn:hover { background:rgba(212,175,55,0.2); color:#e8c84a; }

        /* ── BODY ── */
        .ud-body { max-width: 980px; margin: 0 auto; padding: 44px 24px 100px; }

        /* ── PAGE HEADER ── */
        .ud-page-header { margin-bottom: 40px; }
        .ud-eyebrow {
          font-size:11px; letter-spacing:0.16em; text-transform:uppercase;
          color:#d4af37; font-weight:600; margin-bottom:10px;
          display:flex; align-items:center; gap:8px;
        }
        .ud-eyebrow::before { content:''; display:inline-block; width:18px; height:1px; background:rgba(212,175,55,0.5); }
        .ud-page-title { font-family:'Playfair Display',serif; font-size:clamp(1.7rem,3vw,2.2rem); color:#f0ebe0; font-weight:500; margin-bottom:6px; }
        .ud-page-sub { font-size:14px; color:#424759; font-weight:300; line-height:1.6; }
        .ud-welcome-name { color:#d4af37; }

        /* ── STATS ── */
        .ud-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:36px; }
        .ud-stat {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.065);
          border-radius:14px; padding:18px 18px 16px;
          position:relative; overflow:hidden;
          transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;
        }
        .ud-stat:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.35); border-color:rgba(255,255,255,0.12); }
        .ud-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:14px 14px 0 0; }
        .ud-stat.s-total::before  { background:linear-gradient(90deg,#d4af37,#b8882e); }
        .ud-stat.s-done::before   { background:linear-gradient(90deg,#34d399,#059669); }
        .ud-stat.s-wait::before   { background:linear-gradient(90deg,#94a3b8,#64748b); }
        .ud-stat.s-prog::before   { background:linear-gradient(90deg,#818cf8,#6366f1); }
        .ud-stat.s-sub::before    { background:linear-gradient(90deg,#60a5fa,#3b82f6); }
        .ud-stat-num { font-family:'Playfair Display',serif; font-size:1.9rem; font-weight:500; line-height:1; margin-bottom:4px; }
        .ud-stat.s-total .ud-stat-num { color:#d4af37; }
        .ud-stat.s-done  .ud-stat-num { color:#34d399; }
        .ud-stat.s-wait  .ud-stat-num { color:#94a3b8; }
        .ud-stat.s-prog  .ud-stat-num { color:#818cf8; }
        .ud-stat.s-sub   .ud-stat-num { color:#60a5fa; }
        .ud-stat-label { font-size:10.5px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase; color:#2e3348; }

        /* ── FILTER ROW ── */
        .ud-filter-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; gap:12px; flex-wrap:wrap; }
        .ud-filter-pills { display:flex; gap:6px; flex-wrap:wrap; }
        .ud-pill {
          font-size:11.5px; font-weight:500; letter-spacing:0.04em;
          padding:5px 14px; border-radius:20px; cursor:pointer;
          border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03);
          color:#3d4258; font-family:'DM Sans',sans-serif; transition:all 0.18s;
        }
        .ud-pill:hover { color:#94a0b8; border-color:rgba(255,255,255,0.13); }
        .ud-pill.act {
          background:rgba(212,175,55,0.12); border-color:rgba(212,175,55,0.35); color:#d4af37;
        }
        .ud-pill.act.blue-active { background:rgba(96,165,250,0.12); border-color:rgba(96,165,250,0.35); color:#60a5fa; }
        .ud-task-count { font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#2e3348; font-weight:500; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 12px; border-radius:20px; }

        /* ── TASK GRID ── */
        .ud-task-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:18px; }

        /* ── TASK CARD ── */
        .ud-task-card {
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.065);
          border-radius:16px; padding:22px;
          display:flex; flex-direction:column; gap:13px;
          transition:border-color 0.22s,background 0.22s,transform 0.22s,box-shadow 0.22s;
          position:relative; overflow:hidden;
        }
        .ud-task-card:hover { border-color:rgba(212,175,55,0.2); background:rgba(255,255,255,0.038); transform:translateY(-3px); box-shadow:0 18px 48px rgba(0,0,0,0.4); }
        .ud-task-card::after { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; border-radius:16px 0 0 16px; transition:background 0.22s; }
        .ud-task-card:hover::after { background:linear-gradient(180deg,#d4af37,#b8882e); }
        .ud-task-card.is-submitted::after { background:rgba(96,165,250,0.6) !important; }
        .ud-task-card.is-done { opacity:0.66; }
        .ud-task-card.is-done .ud-task-title { text-decoration:line-through; text-decoration-color:rgba(255,255,255,0.18); }

        .ud-task-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .ud-task-title { font-size:15px; font-weight:600; color:#d8d4ee; line-height:1.4; flex:1; }
        .ud-task-desc { font-size:13px; color:#454b62; line-height:1.65; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .ud-task-meta { display:flex; flex-wrap:wrap; gap:7px; align-items:center; }

        /* ── SUBMISSION BANNER ── */
        .ud-sub-banner {
          background:rgba(96,165,250,0.06); border:1px solid rgba(96,165,250,0.18);
          border-radius:10px; padding:10px 13px;
          display:flex; flex-direction:column; gap:5px;
        }
        .ud-sub-banner-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .ud-sub-banner-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#3d4a6a; }
        .ud-sub-link {
          font-size:11.5px; color:#60a5fa; font-weight:500;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;
          text-decoration:none;
        }
        .ud-sub-link:hover { text-decoration:underline; }
        .ud-sub-date { font-size:10.5px; color:#2a3550; margin-top:1px; }

        /* ── TASK FOOTER ── */
        .ud-task-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .ud-submit-btn {
          display:inline-flex; align-items:center; gap:6px;
          background:linear-gradient(135deg,rgba(212,175,55,0.18),rgba(184,136,46,0.1));
          border:1px solid rgba(212,175,55,0.3);
          color:#d4af37; font-size:11.5px; font-weight:600; letter-spacing:0.04em;
          padding:7px 14px; border-radius:9px; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all 0.2s; white-space:nowrap;
        }
        .ud-submit-btn:hover { background:rgba(212,175,55,0.28); border-color:rgba(212,175,55,0.5); color:#e8c84a; }
        .ud-resubmit-btn {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(96,165,250,0.08); border:1px solid rgba(96,165,250,0.25);
          color:#60a5fa; font-size:11.5px; font-weight:600; letter-spacing:0.04em;
          padding:7px 14px; border-radius:9px; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all 0.2s; white-space:nowrap;
        }
        .ud-resubmit-btn:hover { background:rgba(96,165,250,0.18); border-color:rgba(96,165,250,0.45); color:#93c5fd; }
        .ud-card-date { font-size:10.5px; color:#2a2f42; }

        /* ── ASSIGNED BY ── */
        .ud-by { display:flex; align-items:center; gap:5px; font-size:11px; color:#2a2f42; }
        .ud-by-dot {
          width:18px; height:18px; border-radius:50%;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09);
          display:flex; align-items:center; justify-content:center;
          font-size:9px; font-weight:700; color:#94a0b8;
        }

        /* ── EMPTY ── */
        .ud-empty {
          text-align:center; padding:72px 24px;
          background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.07); border-radius:18px;
        }
        .ud-empty-icon {
          width:56px; height:56px; border-radius:16px;
          background:rgba(212,175,55,0.07); border:1px solid rgba(212,175,55,0.15);
          display:flex; align-items:center; justify-content:center; margin:0 auto 18px;
        }
        .ud-empty-icon svg { width:24px; height:24px; stroke:#d4af37; opacity:0.5; }
        .ud-empty-title { font-size:16px; font-weight:600; color:#2e3348; margin-bottom:6px; }
        .ud-empty-sub { font-size:13.5px; color:#1e2234; }

        /* ── LOADER ── */
        .ud-loader { text-align:center; padding:80px 0; }
        .spin { animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── ERROR BANNER ── */
        .ud-error {
          display:flex; align-items:center; gap:10px;
          background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);
          border-radius:12px; padding:14px 18px; color:#f87171; font-size:13.5px;
        }

        /* ── MODAL ── */
        .ud-modal-overlay {
          position:fixed; inset:0; z-index:200;
          background:rgba(4,4,12,0.82); backdrop-filter:blur(10px);
          display:flex; align-items:center; justify-content:center; padding:24px;
          animation:fade-in 0.18s ease;
        }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        .ud-modal {
          background:#0e0f1c; border:1px solid rgba(255,255,255,0.1);
          border-radius:22px; width:100%; max-width:460px; overflow:hidden;
          animation:modal-up 0.22s cubic-bezier(.2,.8,.4,1);
        }
        @keyframes modal-up { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:none} }
        .ud-modal-header {
          padding:22px 24px 18px; border-bottom:1px solid rgba(255,255,255,0.07);
          display:flex; align-items:center; justify-content:space-between;
        }
        .ud-modal-title { font-size:15px; font-weight:600; color:#d0cce8; }
        .ud-modal-title-sub { font-size:11.5px; color:#3d4258; font-weight:400; margin-top:2px; }
        .ud-modal-close {
          width:28px; height:28px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.04); cursor:pointer; color:#5a6070;
          display:flex; align-items:center; justify-content:center; transition:all 0.2s;
        }
        .ud-modal-close:hover { background:rgba(255,255,255,0.09); color:#94a0b8; }
        .ud-modal-body { padding:22px 24px; }
        .ud-modal-task-box {
          display:flex; align-items:flex-start; gap:10px;
          font-size:13.5px; color:#d4af37; font-weight:500; margin-bottom:20px;
          padding:11px 14px; background:rgba(212,175,55,0.07);
          border:1px solid rgba(212,175,55,0.15); border-radius:10px;
        }
        .ud-modal-task-box svg { flex-shrink:0; margin-top:1px; }

        /* previous submission inside modal */
        .ud-prev-sub {
          margin-bottom:18px; padding:10px 13px;
          background:rgba(96,165,250,0.06); border:1px solid rgba(96,165,250,0.2); border-radius:10px;
        }
        .ud-prev-sub-label { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#3d4a6a; margin-bottom:4px; }
        .ud-prev-sub-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .ud-prev-sub-link { font-size:11.5px; color:#60a5fa; font-weight:500; text-decoration:none; word-break:break-all; }
        .ud-prev-sub-link:hover { text-decoration:underline; }

        .ud-modal-label { display:block; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#3d4258; margin-bottom:7px; }
        .ud-modal-input {
          width:100%; background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.09);
          border-radius:9px; padding:12px 14px; font-size:13.5px;
          font-family:'DM Sans',sans-serif; color:#e2e0f0; outline:none;
          transition:border-color 0.2s,box-shadow 0.2s;
        }
        .ud-modal-input:focus { border-color:rgba(212,175,55,0.5); box-shadow:0 0 0 3px rgba(212,175,55,0.08); }
        .ud-modal-input::placeholder { color:#2a2f42; }
        .ud-modal-hint { font-size:11px; color:#2a3550; margin-top:7px; line-height:1.5; }
        .ud-modal-err { margin-top:10px; font-size:12.5px; color:#f87171; display:flex; align-items:center; gap:6px; }
        .ud-modal-footer { padding:0 24px 24px; display:flex; gap:10px; }
        .ud-btn-cancel {
          flex:1; padding:11px; border-radius:9px;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
          color:#5a6070; font-size:13px; font-weight:500; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all 0.2s;
        }
        .ud-btn-cancel:hover { background:rgba(255,255,255,0.09); color:#94a0b8; }
        .ud-btn-send {
          flex:2; padding:11px; border-radius:9px;
          background:linear-gradient(135deg,#d4af37,#b8882e);
          border:none; color:#0b0b0f;
          font-size:13px; font-weight:700; letter-spacing:0.03em;
          cursor:pointer; font-family:'DM Sans',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition:opacity 0.2s,transform 0.15s;
        }
        .ud-btn-send:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .ud-btn-send:disabled { opacity:0.4; cursor:not-allowed; }

        /* ── TOAST ── */
        .ud-toast {
          position:fixed; bottom:28px; right:28px; z-index:300;
          padding:12px 18px; border-radius:11px; font-size:13.5px; font-weight:500;
          display:flex; align-items:center; gap:9px;
          animation:slide-up 0.25s ease; box-shadow:0 10px 40px rgba(0,0,0,0.55);
        }
        @keyframes slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .ud-toast.success { background:rgba(52,211,153,0.18); border:1px solid rgba(52,211,153,0.35); color:#34d399; }
        .ud-toast.error   { background:rgba(239,68,68,0.18);  border:1px solid rgba(239,68,68,0.35);  color:#f87171; }

        /* ── RESPONSIVE ── */
        @media (max-width:780px) {
          .ud-topbar { padding:0 18px; }
          .ud-body   { padding:28px 14px 70px; }
          .ud-stats  { grid-template-columns:repeat(3,1fr); gap:10px; }
          .ud-task-grid { grid-template-columns:1fr; }
          .ud-brand-badge { display:none; }
        }
        @media (max-width:480px) {
          .ud-stats { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      <div className="ud-root">

        {/* ── TOPBAR ── */}
        <div className="ud-topbar">
          <div className="ud-brand">
            <div className="ud-brand-mark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="ud-brand-name">Talent Management System</span>
            <span className="ud-brand-badge">My Dashboard</span>
          </div>
          <div className="ud-topbar-right">
            <button id="admin-dashboard-btn" className="ud-admin-btn" onClick={() => navigate("/dashboard")}>
              Admin View
            </button>
            {user && (
              <div className="ud-user-chip">
                <div className="ud-avatar">{(user.name || user.email || "U")[0].toUpperCase()}</div>
                <span className="ud-user-name">{user.name || user.email}</span>
              </div>
            )}
            <button id="user-logout-btn" className="ud-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="ud-body">

          {/* Page header */}
          <div className="ud-page-header">
            <p className="ud-eyebrow">My Workspace</p>
            <h1 className="ud-page-title">
              Welcome back{user?.name ? ", " : ""}
              <span className="ud-welcome-name">{user?.name || ""}</span>
            </h1>
            <p className="ud-page-sub">
              Track your assigned tasks and submit your work with a GitHub or file link.
            </p>
          </div>

          {/* Stats */}
          <div className="ud-stats">
            <div className="ud-stat s-total">
              <div className="ud-stat-num">{total}</div>
              <div className="ud-stat-label">Assigned</div>
            </div>
            <div className="ud-stat s-done">
              <div className="ud-stat-num">{completed}</div>
              <div className="ud-stat-label">Completed</div>
            </div>
            <div className="ud-stat s-wait">
              <div className="ud-stat-num">{pending}</div>
              <div className="ud-stat-label">Pending</div>
            </div>
            <div className="ud-stat s-prog">
              <div className="ud-stat-num">{inProgress}</div>
              <div className="ud-stat-label">In Progress</div>
            </div>
            <div className="ud-stat s-sub">
              <div className="ud-stat-num">{submitted}</div>
              <div className="ud-stat-label">Submitted</div>
            </div>
          </div>

          {/* Filter row */}
          <div className="ud-filter-row">
            <div className="ud-filter-pills">
              {["All", "Pending", "In Progress", "Completed", "Submitted", "Not Submitted"].map(f => (
                <button
                  key={f}
                  id={`ud-filter-${f.replace(/ /g,"-").toLowerCase()}`}
                  className={`ud-pill${activeFilter === f ? " act" : ""}${f === "Submitted" && activeFilter === f ? " blue-active" : ""}`}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
            <span className="ud-task-count">{filtered.length} / {total}</span>
          </div>

          {/* Task grid */}
          {loading ? (
            <div className="ud-loader">
              <svg className="spin" width="28" height="28" fill="none" stroke="#d4af37" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
              </svg>
              <p style={{ marginTop: 14, fontSize: 13, color: "#2e3348" }}>Loading your workspace…</p>
            </div>

          ) : fetchErr ? (
            <div className="ud-error">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
              </svg>
              {fetchErr}
            </div>

          ) : filtered.length === 0 ? (
            <div className="ud-empty">
              <div className="ud-empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="ud-empty-title">
                {tasks.length === 0 ? "No tasks assigned yet" : `No "${activeFilter}" tasks`}
              </p>
              <p className="ud-empty-sub">
                {tasks.length === 0 ? "Your manager will assign tasks soon." : "Try a different filter."}
              </p>
            </div>

          ) : (
            <div className="ud-task-grid">
              {filtered.map(task => {
                const sub = submittedMap[String(task._id)];
                const isSubmitted = !!sub;
                const isDone = task.status === "Completed";
                return (
                  <div
                    key={task._id}
                    id={`ud-task-${task._id}`}
                    className={`ud-task-card${isDone ? " is-done" : ""}${isSubmitted ? " is-submitted" : ""}`}
                  >
                    {/* Title + priority */}
                    <div className="ud-task-top">
                      <div className="ud-task-title">{task.title}</div>
                      <Badge label={task.priority || "Medium"} colorMap={PRIORITY_COLOR}/>
                    </div>

                    {/* Description */}
                    {task.description && <p className="ud-task-desc">{task.description}</p>}

                    {/* Task status + deadline */}
                    <div className="ud-task-meta">
                      <Badge label={task.status || "Pending"} colorMap={TASK_STATUS_COLOR}/>
                      <DeadlinePill dueDate={task.dueDate}/>
                    </div>

                    {/* ── Submission status banner ── */}
                    {isSubmitted ? (
                      <div className="ud-sub-banner">
                        <div className="ud-sub-banner-row">
                          <span className="ud-sub-banner-label">Submission</span>
                          <Badge label={sub.status || "Submitted"} colorMap={SUB_STATUS_COLOR}/>
                        </div>
                        <a
                          href={sub.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ud-sub-link"
                          title={sub.submissionLink}
                        >{sub.submissionLink}</a>
                        <div className="ud-sub-date">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString("en-US",
                            { month:"short", day:"numeric", year:"numeric" })}
                        </div>
                      </div>
                    ) : (
                      /* empty submission state pill */
                      <div style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        fontSize:11, color:"#3d4258", fontWeight:500,
                        background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.08)",
                        padding:"5px 11px", borderRadius:8,
                      }}>
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
                        </svg>
                        Not submitted yet
                      </div>
                    )}

                    {/* Assigned by */}
                    {task.createdBy && (
                      <div className="ud-by">
                        <div className="ud-by-dot">
                          {(task.createdBy.name || task.createdBy.email || "?")[0].toUpperCase()}
                        </div>
                        <span>by {task.createdBy.name || task.createdBy.email}</span>
                      </div>
                    )}

                    {/* Footer: submit / re-submit button */}
                    <div className="ud-task-footer">
                      {isSubmitted ? (
                        <button
                          id={`resubmit-task-${task._id}`}
                          className="ud-resubmit-btn"
                          onClick={() => openModal(task)}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Re-submit
                        </button>
                      ) : (
                        <button
                          id={`submit-task-${task._id}`}
                          className="ud-submit-btn"
                          onClick={() => openModal(task)}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Submit Work
                        </button>
                      )}
                      <span className="ud-card-date">
                        {task.createdAt
                          ? new Date(task.createdAt).toLocaleDateString("en-US",{ month:"short", day:"numeric" })
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SUBMIT MODAL ── */}
      {submitModal && (() => {
        const existingSub = submittedMap[String(submitModal._id)];
        const isResubmit = !!existingSub;
        return (
          <div
            className="ud-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setSubmitModal(null); }}
          >
            <div className="ud-modal">
              <div className="ud-modal-header">
                <div>
                  <div className="ud-modal-title">
                    {isResubmit ? "Re-submit Your Work" : "Submit Your Work"}
                  </div>
                  {isResubmit && (
                    <div className="ud-modal-title-sub">Update your previous submission link</div>
                  )}
                </div>
                <button className="ud-modal-close" onClick={() => setSubmitModal(null)} aria-label="Close">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="ud-modal-body">
                  {/* task name */}
                  <div className="ud-modal-task-box">
                    <svg width="14" height="14" fill="none" stroke="#d4af37" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    {submitModal.title}
                  </div>

                  {/* previous submission info */}
                  {isResubmit && existingSub && (
                    <div className="ud-prev-sub">
                      <div className="ud-prev-sub-label">Previous submission · {existingSub.status}</div>
                      <div className="ud-prev-sub-row">
                        <a href={existingSub.submissionLink} target="_blank" rel="noopener noreferrer"
                          className="ud-prev-sub-link">{existingSub.submissionLink}</a>
                        <Badge label={existingSub.status} colorMap={SUB_STATUS_COLOR}/>
                      </div>
                    </div>
                  )}

                  {/* link input */}
                  <label className="ud-modal-label" htmlFor="submission-link">
                    {isResubmit ? "New Submission Link" : "Submission Link"}
                  </label>
                  <input
                    id="submission-link"
                    className="ud-modal-input"
                    type="url"
                    placeholder="https://github.com/username/repo  or  https://drive.google.com/…"
                    value={subLink}
                    onChange={(e) => { setSubLink(e.target.value); setSubErr(""); }}
                    autoFocus
                  />
                  <p className="ud-modal-hint">
                    Paste a GitHub repo, Google Drive, Notion, or any public link to your work.
                  </p>
                  {subErr && (
                    <div className="ud-modal-err">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
                      </svg>
                      {subErr}
                    </div>
                  )}
                </div>

                <div className="ud-modal-footer">
                  <button type="button" className="ud-btn-cancel" onClick={() => setSubmitModal(null)}>
                    Cancel
                  </button>
                  <button id="confirm-submit-btn" type="submit" className="ud-btn-send" disabled={submitting}>
                    {submitting ? (
                      <>
                        <svg className="spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {isResubmit ? "Update Submission" : "Send Submission"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`ud-toast ${toast.type}`}>
          {toast.type === "success"
            ? <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </>
  );
}
