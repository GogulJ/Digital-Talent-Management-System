import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

/* ─── colour maps ─── */
const SUB_STATUS_COLOR = {
  Submitted: { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#60a5fa" },
  Reviewed:  { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "#fbbf24" },
  Approved:  { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399" },
  Rejected:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   text: "#ef4444" },
};

function Badge({ label, colorMap }) {
  const c = colorMap[label] || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", text: "#94a3b8" };
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", display: "inline-block",
    }}>{label}</span>
  );
}

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  /* ── state ── */
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchErr,     setFetchErr]     = useState("");
  const [activeFilter, setFilter]       = useState("All");
  const [search,       setSearch]       = useState("");
  const [updating,     setUpdating]     = useState(null); // submissionId being updated
  const [toast,        setToast]        = useState(null);

  /* ── derived stats ── */
  const total    = submissions.length;
  const byStatus = (s) => submissions.filter(x => x.status === s).length;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── fetch all submissions ── */
  const fetchSubmissions = useCallback(async () => {
    setLoading(true); setFetchErr("");
    try {
      const res = await API.get("/api/submissions");
      setSubmissions(res.data);
    } catch (err) {
      setFetchErr(err.response?.data?.msg || "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchSubmissions();
  }, []);

  /* ── update status (Approve / Reject / Reviewed) ── */
  const handleUpdateStatus = async (submissionId, status) => {
    setUpdating(submissionId);
    try {
      const res = await API.put("/api/submissions/update-status", { submissionId, status });
      // optimistic UI update
      setSubmissions(prev =>
        prev.map(s => s._id === submissionId ? { ...s, status: res.data.submission.status } : s)
      );
      showToast(`Marked as ${status} ✓`);
    } catch (err) {
      showToast(err.response?.data?.msg || "Update failed.", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ── filtered + searched list ── */
  const filtered = submissions
    .filter(s => activeFilter === "All" || s.status === activeFilter)
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.userId?.name?.toLowerCase().includes(q) ||
        s.userId?.email?.toLowerCase().includes(q) ||
        s.taskId?.title?.toLowerCase().includes(q) ||
        s.submissionLink?.toLowerCase().includes(q)
      );
    });

  /* ═══════════════════ JSX ═══════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .as-root { min-height: 100vh; background: #080810; font-family: 'DM Sans', sans-serif; color: #e2e0f0; }

        /* ── TOPBAR ── */
        .as-topbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px; height: 64px;
          background: rgba(8,8,16,0.9); backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .as-brand { display: flex; align-items: center; gap: 10px; }
        .as-brand-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(184,136,46,0.12));
          border: 1px solid rgba(212,175,55,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .as-brand-mark svg { width: 16px; height: 16px; stroke: #d4af37; }
        .as-brand-name { font-family: 'Playfair Display', serif; font-size: 16px; color: #e8e0cc; letter-spacing: 0.02em; }
        .as-brand-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: #d4af37; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.25);
          padding: 2px 7px; border-radius: 20px; margin-left: 4px;
        }
        .as-topbar-right { display: flex; align-items: center; gap: 12px; }
        .as-nav-btn {
          font-size: 12px; font-weight: 500; padding: 6px 15px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s; letter-spacing: 0.03em;
        }
        .as-nav-btn.gold { background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.25); color: #d4af37; }
        .as-nav-btn.gold:hover { background: rgba(212,175,55,0.2); color: #e8c84a; }
        .as-nav-btn.red { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22); color: #f87171; }
        .as-nav-btn.red:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
        .as-user-chip {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 5px 14px 5px 6px;
        }
        .as-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #0b0b0f;
        }
        .as-user-name { font-size: 13px; color: #94a0b8; }

        /* ── BODY ── */
        .as-body { max-width: 1100px; margin: 0 auto; padding: 44px 24px 100px; }

        /* ── PAGE HEADER ── */
        .as-page-header { margin-bottom: 38px; }
        .as-eyebrow {
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          color: #d4af37; font-weight: 600; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .as-eyebrow::before { content: ''; display: inline-block; width: 18px; height: 1px; background: rgba(212,175,55,0.5); }
        .as-page-title { font-family: 'Playfair Display', serif; font-size: clamp(1.7rem, 3vw, 2.2rem); color: #f0ebe0; font-weight: 500; margin-bottom: 6px; }
        .as-page-sub { font-size: 14px; color: #424759; font-weight: 300; }

        /* ── STATS ── */
        .as-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 34px; }
        .as-stat {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.065);
          border-radius: 14px; padding: 18px 18px 16px;
          position: relative; overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .as-stat:hover { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(0,0,0,0.35); border-color: rgba(255,255,255,0.12); }
        .as-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 14px 14px 0 0; }
        .as-stat.c-all::before      { background: linear-gradient(90deg, #d4af37, #b8882e); }
        .as-stat.c-sub::before      { background: linear-gradient(90deg, #60a5fa, #3b82f6); }
        .as-stat.c-rev::before      { background: linear-gradient(90deg, #fbbf24, #d97706); }
        .as-stat.c-app::before      { background: linear-gradient(90deg, #34d399, #059669); }
        .as-stat.c-rej::before      { background: linear-gradient(90deg, #ef4444, #dc2626); }
        .as-stat-num { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 500; line-height: 1; margin-bottom: 4px; }
        .as-stat.c-all .as-stat-num { color: #d4af37; }
        .as-stat.c-sub .as-stat-num { color: #60a5fa; }
        .as-stat.c-rev .as-stat-num { color: #fbbf24; }
        .as-stat.c-app .as-stat-num { color: #34d399; }
        .as-stat.c-rej .as-stat-num { color: #ef4444; }
        .as-stat-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #2e3348; }

        /* ── TOOLBAR ── */
        .as-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .as-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .as-pill {
          font-size: 11.5px; font-weight: 500; letter-spacing: 0.04em;
          padding: 5px 14px; border-radius: 20px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
          color: #3d4258; font-family: 'DM Sans', sans-serif; transition: all 0.18s;
        }
        .as-pill:hover { color: #94a0b8; border-color: rgba(255,255,255,0.13); }
        .as-pill.act { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.35); color: #d4af37; }
        .as-pill.act.blue  { background: rgba(96,165,250,0.12); border-color: rgba(96,165,250,0.35); color: #60a5fa; }
        .as-pill.act.green { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.35); color: #34d399; }
        .as-pill.act.red   { background: rgba(239,68,68,0.12);  border-color: rgba(239,68,68,0.35);  color: #ef4444; }
        .as-pill.act.yellow{ background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.35); color: #fbbf24; }

        .as-search-wrap { position: relative; }
        .as-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #3d4258; }
        .as-search {
          background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 8px 14px 8px 36px;
          font-size: 13px; color: #e2e0f0; font-family: 'DM Sans', sans-serif;
          outline: none; width: 220px; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .as-search::placeholder { color: #2e3348; }
        .as-search:focus { border-color: rgba(212,175,55,0.4); box-shadow: 0 0 0 3px rgba(212,175,55,0.07); }

        .as-count-badge {
          font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #2e3348; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06); padding: 4px 12px; border-radius: 20px;
        }

        /* ── TABLE CARD ── */
        .as-table-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.065);
          border-radius: 18px; overflow: hidden;
        }

        /* ── TABLE ── */
        .as-table { width: 100%; border-collapse: collapse; }
        .as-table th {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: #2e3348; padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-align: left; white-space: nowrap;
        }
        .as-table th:last-child { text-align: center; }
        .as-table td {
          padding: 16px 20px; font-size: 13px; color: #a0a8c0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .as-table tr:last-child td { border-bottom: none; }
        .as-table tr { transition: background 0.15s; }
        .as-table tr:hover td { background: rgba(255,255,255,0.02); }

        /* user cell */
        .as-user-cell { display: flex; align-items: center; gap: 10px; }
        .as-user-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(184,136,46,0.2));
          border: 1px solid rgba(212,175,55,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #d4af37;
        }
        .as-user-info-name { font-size: 13px; font-weight: 600; color: #d0cce8; line-height: 1.3; }
        .as-user-info-email { font-size: 11px; color: #3d4258; }

        /* task cell */
        .as-task-name { font-size: 13px; font-weight: 500; color: #c8c4e0; line-height: 1.4; }
        .as-task-desc { font-size: 11px; color: #2e3348; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        /* link cell */
        .as-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; color: #60a5fa; font-weight: 500;
          text-decoration: none; max-width: 200px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .as-link:hover { text-decoration: underline; color: #93c5fd; }

        /* date cell */
        .as-date { font-size: 11.5px; color: #3d4258; white-space: nowrap; }

        /* actions cell */
        .as-actions { display: flex; align-items: center; gap: 7px; justify-content: center; }
        .as-act-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.03em;
          padding: 6px 13px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.18s;
          white-space: nowrap; border: 1px solid transparent;
        }
        .as-act-btn:disabled { opacity: 0.38; cursor: not-allowed; }
        .as-act-btn.approve {
          background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #34d399;
        }
        .as-act-btn.approve:hover:not(:disabled) { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.5); color: #6ee7b7; }
        .as-act-btn.reject {
          background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.28); color: #f87171;
        }
        .as-act-btn.reject:hover:not(:disabled) { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); color: #fca5a5; }
        .as-act-btn.review {
          background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.28); color: #fbbf24;
        }
        .as-act-btn.review:hover:not(:disabled) { background: rgba(251,191,36,0.2); border-color: rgba(251,191,36,0.5); color: #fcd34d; }
        .as-act-btn.reset {
          background: rgba(148,163,184,0.08); border-color: rgba(148,163,184,0.2); color: #64748b;
        }
        .as-act-btn.reset:hover:not(:disabled) { background: rgba(148,163,184,0.15); color: #94a3b8; }

        /* spin */
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── EMPTY ── */
        .as-empty {
          text-align: center; padding: 72px 24px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.07); border-radius: 18px;
        }
        .as-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.15);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;
        }
        .as-empty-icon svg { width: 24px; height: 24px; stroke: #d4af37; opacity: 0.5; }
        .as-empty-title { font-size: 16px; font-weight: 600; color: #2e3348; margin-bottom: 6px; }
        .as-empty-sub { font-size: 13px; color: #1e2234; }

        /* ── LOADER ── */
        .as-loader { text-align: center; padding: 80px 0; }

        /* ── ERROR ── */
        .as-error {
          display: flex; align-items: center; gap: 10px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 18px; color: #f87171; font-size: 13.5px;
        }

        /* ── TOAST ── */
        .as-toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 300;
          padding: 12px 18px; border-radius: 11px; font-size: 13.5px; font-weight: 500;
          display: flex; align-items: center; gap: 9px;
          animation: slide-up 0.25s ease; box-shadow: 0 10px 40px rgba(0,0,0,0.55);
        }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .as-toast.success { background: rgba(52,211,153,0.18); border: 1px solid rgba(52,211,153,0.35); color: #34d399; }
        .as-toast.error   { background: rgba(239,68,68,0.18);  border: 1px solid rgba(239,68,68,0.35);  color: #f87171; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .as-topbar { padding: 0 18px; }
          .as-body { padding: 28px 14px 70px; }
          .as-stats { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .as-table td, .as-table th { padding: 12px 14px; }
          .as-search { width: 160px; }
        }
        @media (max-width: 640px) {
          .as-stats { grid-template-columns: repeat(2, 1fr); }
          .as-toolbar { flex-direction: column; align-items: flex-start; }
          .as-table-card { overflow-x: auto; }
        }
      `}</style>

      <div className="as-root">

        {/* ── TOPBAR ── */}
        <div className="as-topbar">
          <div className="as-brand">
            <div className="as-brand-mark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="as-brand-name">Talent Management System</span>
            <span className="as-brand-badge">Admin</span>
          </div>
          <div className="as-topbar-right">
            <button id="go-dashboard-btn" className="as-nav-btn gold" onClick={() => navigate("/dashboard")}>
              Task Dashboard
            </button>
            <button id="go-user-btn" className="as-nav-btn gold" onClick={() => navigate("/user-dashboard")}>
              User View
            </button>
            {user && (
              <div className="as-user-chip">
                <div className="as-avatar">{(user.name || user.email || "A")[0].toUpperCase()}</div>
                <span className="as-user-name">{user.name || user.email}</span>
              </div>
            )}
            <button id="admin-logout-btn" className="as-nav-btn red" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="as-body">

          {/* Page header */}
          <div className="as-page-header">
            <p className="as-eyebrow">Admin Panel</p>
            <h1 className="as-page-title">Submission Review</h1>
            <p className="as-page-sub">
              Review task submissions from all users — approve, reject, or mark for review.
            </p>
          </div>

          {/* Stats */}
          <div className="as-stats">
            <div className="as-stat c-all">
              <div className="as-stat-num">{total}</div>
              <div className="as-stat-label">Total</div>
            </div>
            <div className="as-stat c-sub">
              <div className="as-stat-num">{byStatus("Submitted")}</div>
              <div className="as-stat-label">Submitted</div>
            </div>
            <div className="as-stat c-rev">
              <div className="as-stat-num">{byStatus("Reviewed")}</div>
              <div className="as-stat-label">Reviewed</div>
            </div>
            <div className="as-stat c-app">
              <div className="as-stat-num">{byStatus("Approved")}</div>
              <div className="as-stat-label">Approved</div>
            </div>
            <div className="as-stat c-rej">
              <div className="as-stat-num">{byStatus("Rejected")}</div>
              <div className="as-stat-label">Rejected</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="as-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div className="as-filter-pills">
                {[
                  { label: "All",       cls: "" },
                  { label: "Submitted", cls: "blue" },
                  { label: "Reviewed",  cls: "yellow" },
                  { label: "Approved",  cls: "green" },
                  { label: "Rejected",  cls: "red" },
                ].map(({ label, cls }) => (
                  <button
                    key={label}
                    id={`as-filter-${label.toLowerCase()}`}
                    className={`as-pill${activeFilter === label ? ` act ${cls}` : ""}`}
                    onClick={() => setFilter(label)}
                  >{label}</button>
                ))}
              </div>
              <span className="as-count-badge">{filtered.length} / {total}</span>
            </div>
            <div className="as-search-wrap">
              <svg className="as-search-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                id="as-search-input"
                className="as-search"
                type="text"
                placeholder="Search user, task, link…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="as-loader">
              <svg className="spin" width="28" height="28" fill="none" stroke="#d4af37" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
              </svg>
              <p style={{ marginTop: 14, fontSize: 13, color: "#2e3348" }}>Loading submissions…</p>
            </div>

          ) : fetchErr ? (
            <div className="as-error">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
              </svg>
              {fetchErr}
            </div>

          ) : filtered.length === 0 ? (
            <div className="as-empty">
              <div className="as-empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="as-empty-title">
                {submissions.length === 0 ? "No submissions yet" : `No "${activeFilter}" submissions`}
              </p>
              <p className="as-empty-sub">
                {submissions.length === 0
                  ? "Users haven't submitted any work yet."
                  : "Try a different filter or clear the search."}
              </p>
            </div>

          ) : (
            <div className="as-table-card">
              <table className="as-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Task</th>
                    <th>Submission Link</th>
                    <th>Submitted At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub, idx) => {
                    const isBusy = updating === sub._id;
                    return (
                      <tr key={sub._id} id={`submission-row-${sub._id}`}>
                        {/* # */}
                        <td style={{ color: "#2e3348", fontSize: 12 }}>{idx + 1}</td>

                        {/* User */}
                        <td>
                          <div className="as-user-cell">
                            <div className="as-user-avatar">
                              {(sub.userId?.name || sub.userId?.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="as-user-info-name">{sub.userId?.name || "—"}</div>
                              <div className="as-user-info-email">{sub.userId?.email || ""}</div>
                            </div>
                          </div>
                        </td>

                        {/* Task */}
                        <td>
                          <div className="as-task-name">{sub.taskId?.title || "—"}</div>
                          {sub.taskId?.description && (
                            <div className="as-task-desc">{sub.taskId.description}</div>
                          )}
                        </td>

                        {/* Submission Link */}
                        <td>
                          <a
                            href={sub.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="as-link"
                            title={sub.submissionLink}
                          >
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round"/>
                              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round"/>
                            </svg>
                            {sub.submissionLink}
                          </a>
                        </td>

                        {/* Date */}
                        <td>
                          <div className="as-date">
                            {new Date(sub.submittedAt).toLocaleDateString("en-US",
                              { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#1e2234", marginTop: 2 }}>
                            {new Date(sub.submittedAt).toLocaleTimeString("en-US",
                              { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td>
                          <Badge label={sub.status} colorMap={SUB_STATUS_COLOR}/>
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div className="as-actions">
                            {/* Approve */}
                            <button
                              id={`approve-${sub._id}`}
                              className="as-act-btn approve"
                              disabled={isBusy || sub.status === "Approved"}
                              title="Approve"
                              onClick={() => handleUpdateStatus(sub._id, "Approved")}
                            >
                              {isBusy && updating === sub._id ? (
                                <svg className="spin" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              Approve
                            </button>

                            {/* Reject */}
                            <button
                              id={`reject-${sub._id}`}
                              className="as-act-btn reject"
                              disabled={isBusy || sub.status === "Rejected"}
                              title="Reject"
                              onClick={() => handleUpdateStatus(sub._id, "Rejected")}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                              </svg>
                              Reject
                            </button>

                            {/* Mark as Reviewed */}
                            <button
                              id={`review-${sub._id}`}
                              className="as-act-btn review"
                              disabled={isBusy || sub.status === "Reviewed"}
                              title="Mark as Reviewed"
                              onClick={() => handleUpdateStatus(sub._id, "Reviewed")}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`as-toast ${toast.type}`}>
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
