import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const STATUS_OPTIONS = ["Pending", "In Progress", "Completed"];

const PRIORITY_COLOR = {
  Low: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.4)", text: "#34d399" },
  Medium: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.4)", text: "#fbbf24" },
  High: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", text: "#ef4444" },
};

const STATUS_COLOR = {
  Pending: { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
  "In Progress": { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.4)", text: "#818cf8" },
  Completed: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.4)", text: "#34d399" },
};

function Badge({ label, colorMap }) {
  const c = colorMap[label] || colorMap["Pending"] || {};
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      padding: "3px 9px",
      borderRadius: 20,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  // ── Task state ──
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  // ── Form state ──
  const EMPTY_FORM = { title: "", description: "", priority: "Medium", status: "Pending" };
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // ── Edit state ──
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Delete state ──
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ── Filter state ──
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Toast ──
  const [toast, setToast] = useState(null);

  // ── Computed stats ──
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch tasks ──
  const fetchTasks = async () => {
    setLoading(true);
    setFetchErr("");
    try {
      const res = await API.get("/api/tasks");
      setTasks(res.data);
    } catch (err) {
      setFetchErr(err.response?.data?.message || "Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/"); return; }
    fetchTasks();
  }, []);

  // ── Add task ──
  const handleAddTask = async (e) => {
    e.preventDefault();
    setFormErr(""); setFormSuccess("");
    if (!form.title.trim()) { setFormErr("Title is required."); return; }
    setSubmitting(true);
    try {
      await API.post("/api/tasks", form);
      setForm(EMPTY_FORM);
      setFormSuccess("Task added successfully!");
      showToast("Task created ✓");
      fetchTasks();
      setTimeout(() => setFormSuccess(""), 2500);
    } catch (err) {
      setFormErr(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete task (two-step) ──
  const requestDelete = (id) => setConfirmDeleteId(id);

  const handleDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await API.delete(`/api/tasks/${id}`);
      showToast("Task deleted");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtered tasks ──
  const filteredTasks = activeFilter === "All"
    ? tasks
    : tasks.filter(t => t.status === activeFilter);

  // ── Edit task ──
  const startEdit = (task) => {
    setEditId(task._id);
    setEditForm({ title: task.title, description: task.description || "", priority: task.priority || "Medium", status: task.status || "Pending" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setEditSubmitting(true);
    try {
      await API.put(`/api/tasks/${editId}`, editForm);
      showToast("Task updated ✓");
      setEditId(null);
      fetchTasks();
    } catch {
      showToast("Update failed", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          min-height: 100vh;
          background: #0b0b0f;
          font-family: 'DM Sans', sans-serif;
          color: #e2e0f0;
        }

        /* ── TOPBAR ── */
        .db-topbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          height: 62px;
          background: rgba(11,11,15,0.85);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .db-brand {
          display: flex; align-items: center; gap: 10px;
        }
        .db-brand-mark {
          width: 32px; height: 32px;
          border: 1.5px solid rgba(212,175,55,0.55);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .db-brand-mark svg { width: 16px; height: 16px; stroke: #d4af37; }
        .db-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px; color: #e8e0cc; letter-spacing: 0.02em;
        }
        .db-topbar-right { display: flex; align-items: center; gap: 16px; }
        .db-user-chip {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 5px 14px 5px 8px;
        }
        .db-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #0b0b0f;
        }
        .db-user-name { font-size: 13px; color: #94a0b8; }
        .db-logout-btn {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          color: #f87171; font-size: 12px; font-weight: 500; letter-spacing: 0.04em;
          padding: 6px 14px; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .db-logout-btn:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.45); color: #fca5a5; }

        /* ── LAYOUT ── */
        .db-body { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }

        .db-page-header { margin-bottom: 36px; }
        .db-page-eyebrow {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: #d4af37; font-weight: 500; margin-bottom: 8px;
        }
        .db-page-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 3vw, 2rem); color: #f0ebe0; font-weight: 500;
        }
        .db-page-sub { font-size: 14px; color: #5a6070; margin-top: 6px; font-weight: 300; }

        .db-grid { display: grid; grid-template-columns: 360px 1fr; gap: 28px; align-items: start; }

        /* ── CARD ── */
        .db-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden;
        }
        .db-card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        .db-card-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .db-card-icon svg { width: 15px; height: 15px; stroke: #d4af37; }
        .db-card-title { font-size: 14px; font-weight: 600; color: #d0cce8; letter-spacing: 0.01em; }
        .db-card-body { padding: 24px; }

        /* ── FORM ── */
        .f-group { margin-bottom: 18px; }
        .f-label {
          display: block; font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #5a6070; margin-bottom: 7px;
        }
        .f-input, .f-textarea, .f-select {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 9px; padding: 10px 14px;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          color: #e2e0f0; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .f-input::placeholder, .f-textarea::placeholder { color: #2e3140; }
        .f-input:focus, .f-textarea:focus, .f-select:focus {
          border-color: rgba(212,175,55,0.55);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
          background: rgba(255,255,255,0.05);
        }
        .f-textarea { resize: vertical; min-height: 80px; }
        .f-select { cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%235a6070' strokeWidth='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 36px;
        }
        .f-select option { background: #1a1c28; color: #e2e0f0; }
        .f-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .f-msg {
          display: flex; align-items: center; gap: 8px;
          font-size: 12.5px; padding: 9px 13px; border-radius: 8px; margin-bottom: 16px;
        }
        .f-msg.err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; }
        .f-msg.ok { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2); color: #34d399; }

        .f-submit {
          width: 100%; padding: 11px 20px;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          color: #0b0b0f; font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 600; letter-spacing: 0.04em;
          border: none; border-radius: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .f-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .f-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── TASK LIST ── */
        /* ── STATS GRID ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 20px 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover { border-color: rgba(255,255,255,0.13); transform: translateY(-2px); }
        .stat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 14px 14px 0 0;
        }
        .stat-card.total::before  { background: linear-gradient(90deg, #d4af37, #b8882e); }
        .stat-card.done::before   { background: linear-gradient(90deg, #34d399, #059669); }
        .stat-card.pending::before { background: linear-gradient(90deg, #94a3b8, #64748b); }
        .stat-card.active::before  { background: linear-gradient(90deg, #818cf8, #6366f1); }
        .stat-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .stat-icon svg { width: 16px; height: 16px; }
        .stat-card.total  .stat-icon { background: rgba(212,175,55,0.12); stroke: #d4af37; }
        .stat-card.done   .stat-icon { background: rgba(52,211,153,0.12); stroke: #34d399; }
        .stat-card.pending .stat-icon { background: rgba(148,163,184,0.1); stroke: #94a3b8; }
        .stat-card.active  .stat-icon { background: rgba(129,140,248,0.12); stroke: #818cf8; }
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2rem; font-weight: 500; line-height: 1;
          margin-bottom: 4px;
        }
        .stat-card.total  .stat-num { color: #d4af37; }
        .stat-card.done   .stat-num { color: #34d399; }
        .stat-card.pending .stat-num { color: #94a3b8; }
        .stat-card.active  .stat-num { color: #818cf8; }
        .stat-label {
          font-size: 12px; color: #3d4258;
          font-weight: 500; letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .stat-bar {
          margin-top: 14px;
          height: 3px; border-radius: 3px;
          background: rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .stat-bar-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.6s cubic-bezier(.4,0,.2,1);
        }
        .stat-card.done   .stat-bar-fill { background: #34d399; }
        .stat-card.pending .stat-bar-fill { background: #94a3b8; }
        .stat-card.active  .stat-bar-fill { background: #818cf8; }

        /* ── FILTER PILLS ── */
        .filter-bar {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;
        }
        .filter-pill {
          font-size: 11.5px; font-weight: 500; letter-spacing: 0.04em;
          padding: 4px 12px; border-radius: 20px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #3d4258;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
        }
        .filter-pill:hover { color: #94a0b8; border-color: rgba(255,255,255,0.12); }
        .filter-pill.active-pill {
          background: rgba(212,175,55,0.12);
          border-color: rgba(212,175,55,0.35);
          color: #d4af37;
        }

        /* ── CONFIRM DELETE OVERLAY ── */
        .confirm-overlay {
          position: fixed; inset: 0; z-index: 250;
          background: rgba(5,5,10,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .confirm-box {
          background: #141520; border: 1px solid rgba(239,68,68,0.25);
          border-radius: 16px; padding: 32px; width: 100%; max-width: 360px;
          text-align: center;
          animation: modal-in 0.2s cubic-bezier(.2,.8,.4,1);
        }
        .confirm-icon {
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .confirm-icon svg { width: 22px; height: 22px; stroke: #f87171; }
        .confirm-title { font-size: 16px; font-weight: 600; color: #d0cce8; margin-bottom: 8px; }
        .confirm-sub { font-size: 13px; color: #3d4258; line-height: 1.6; margin-bottom: 24px; }
        .confirm-actions { display: flex; gap: 10px; }
        .btn-confirm-cancel {
          flex: 1; padding: 10px; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: #5a6070; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-confirm-cancel:hover { background: rgba(255,255,255,0.09); color: #94a0b8; }
        .btn-confirm-delete {
          flex: 1; padding: 10px; border-radius: 9px;
          background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
          color: #f87171; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-confirm-delete:hover { background: rgba(239,68,68,0.25); color: #fca5a5; }

        .tasks-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 4px;
        }
        .tasks-count {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #383d52; font-weight: 500;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 3px 10px; border-radius: 20px;
        }

        .task-empty {
          text-align: center; padding: 52px 20px;
          color: #2e3348; font-size: 14px;
        }
        .task-empty svg { display: block; margin: 0 auto 14px; opacity: 0.25; width: 40px; height: 40px; }

        .task-list { display: flex; flex-direction: column; gap: 12px; }

        .task-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.065);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .task-item:hover {
          border-color: rgba(212,175,55,0.2);
          background: rgba(255,255,255,0.045);
        }
        .task-item-top {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;
        }
        .task-title { font-size: 14.5px; font-weight: 600; color: #d8d4ee; line-height: 1.4; }
        .task-desc { font-size: 13px; color: #525769; line-height: 1.6; margin-bottom: 10px; }
        .task-meta {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .task-actions { display: flex; gap: 8px; flex-shrink: 0; }

        .btn-icon {
          width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
          background: rgba(255,255,255,0.05);
        }
        .btn-icon svg { width: 13px; height: 13px; }
        .btn-edit { color: #818cf8; }
        .btn-edit:hover { background: rgba(99,102,241,0.15); color: #a5b4fc; }
        .btn-delete { color: #f87171; }
        .btn-delete:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }

        .task-date { font-size: 11px; color: #2e3348; letter-spacing: 0.02em; }

        /* ── EDIT MODAL ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(5,5,10,0.75);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .modal-box {
          background: #141520; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px; width: 100%; max-width: 460px;
          overflow: hidden;
          animation: modal-in 0.22s cubic-bezier(.2,.8,.4,1);
        }
        @keyframes modal-in { from { opacity:0; transform: scale(0.95) translateY(8px); } to { opacity:1; transform: none; } }
        .modal-header {
          padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title { font-size: 15px; font-weight: 600; color: #d0cce8; }
        .modal-close {
          width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); cursor: pointer; color: #5a6070;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.09); color: #94a0b8; }
        .modal-body { padding: 24px; }
        .modal-footer { padding: 0 24px 24px; display: flex; gap: 10px; }
        .btn-cancel {
          flex: 1; padding: 10px; border-radius: 9px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08); color: #5a6070; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.09); color: #94a0b8; }
        .btn-save {
          flex: 1; padding: 10px; border-radius: 9px;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          border: none; color: #0b0b0f; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.2s;
        }
        .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-save:hover:not(:disabled) { opacity: 0.88; }

        /* ── TOAST ── */
        .toast {
          position: fixed; bottom: 28px; right: 28px; z-index: 300;
          padding: 12px 18px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500;
          display: flex; align-items: center; gap: 8px;
          animation: slide-up 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        @keyframes slide-up { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        .toast.success { background: rgba(52,211,153,0.18); border: 1px solid rgba(52,211,153,0.35); color: #34d399; }
        .toast.error { background: rgba(239,68,68,0.18); border: 1px solid rgba(239,68,68,0.35); color: #f87171; }

        /* ── LOADER ── */
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .db-grid { grid-template-columns: 1fr; }
          .db-topbar { padding: 0 18px; }
          .db-body { padding: 28px 16px 60px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-num { font-size: 1.6rem; }
        }
      `}</style>

      <div className="db-root">
        {/* ── Topbar ── */}
        <div className="db-topbar">
          <div className="db-brand">
            <div className="db-brand-mark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="db-brand-name">Talent Management System</span>
          </div>

          <div className="db-topbar-right">
            {user && (
              <div className="db-user-chip">
                <div className="db-avatar">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="db-user-name">{user.name || user.email}</span>
              </div>
            )}
            <button id="logout-btn" className="db-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="db-body">
          <div className="db-page-header">
            <p className="db-page-eyebrow">Workspace</p>
            <h1 className="db-page-title">Task Dashboard</h1>
            <p className="db-page-sub">Manage and track your team's tasks in one place.</p>
          </div>

          {/* ── Stats Row ── */}
          <div className="stats-grid">
            {/* Total */}
            <div className="stat-card total">
              <div className="stat-icon">
                <svg fill="none" stroke="#d4af37" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="stat-num">{total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>

            {/* Completed */}
            <div className="stat-card done">
              <div className="stat-icon">
                <svg fill="none" stroke="#34d399" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-num">{completed}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: total ? `${(completed/total)*100}%` : '0%' }} />
              </div>
            </div>

            {/* Pending */}
            <div className="stat-card pending">
              <div className="stat-icon">
                <svg fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="stat-num">{pending}</div>
              <div className="stat-label">Pending</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: total ? `${(pending/total)*100}%` : '0%' }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="stat-card active">
              <div className="stat-icon">
                <svg fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-num">{inProgress}</div>
              <div className="stat-label">In Progress</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: total ? `${(inProgress/total)*100}%` : '0%' }} />
              </div>
            </div>
          </div>

          <div className="db-grid">
            {/* ── Add Task Form ── */}
            <div>
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="db-card-title">Add New Task</span>
                </div>
                <div className="db-card-body">
                  {formErr && (
                    <div className="f-msg err">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                      </svg>
                      {formErr}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="f-msg ok">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {formSuccess}
                    </div>
                  )}

                  <form id="add-task-form" onSubmit={handleAddTask}>
                    <div className="f-group">
                      <label className="f-label" htmlFor="task-title">Title *</label>
                      <input
                        id="task-title"
                        className="f-input"
                        type="text"
                        placeholder="e.g. Design onboarding flow"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="f-group">
                      <label className="f-label" htmlFor="task-description">Description</label>
                      <textarea
                        id="task-description"
                        className="f-textarea"
                        placeholder="Optional details about this task…"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    <div className="f-row">
                      <div className="f-group" style={{ marginBottom: 0 }}>
                        <label className="f-label" htmlFor="task-priority">Priority</label>
                        <select
                          id="task-priority"
                          className="f-select"
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        >
                          {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="f-group" style={{ marginBottom: 0 }}>
                        <label className="f-label" htmlFor="task-status">Status</label>
                        <select
                          id="task-status"
                          className="f-select"
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <button id="add-task-btn" type="submit" className="f-submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <svg className="spin" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round" />
                            </svg>
                            Adding…
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                              <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                            </svg>
                            Add Task
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* ── Task List ── */}
            <div>
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="db-card-title">All Tasks</span>
                    <span className="tasks-count">{filteredTasks.length} / {tasks.length}</span>
                  </div>
                </div>
                {/* Filter bar */}
                <div style={{ padding: "14px 20px 0" }}>
                  <div className="filter-bar">
                    {["All", "Pending", "In Progress", "Completed"].map(f => (
                      <button
                        key={f}
                        className={`filter-pill${activeFilter === f ? " active-pill" : ""}`}
                        onClick={() => setActiveFilter(f)}
                        id={`filter-${f.replace(" ","-").toLowerCase()}`}
                      >{f}</button>
                    ))}
                  </div>
                </div>
                <div className="db-card-body">
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#2e3348" }}>
                      <svg className="spin" style={{ display: "inline-block", marginBottom: 12 }} width="24" height="24" fill="none" stroke="#d4af37" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round" />
                      </svg>
                      <p style={{ fontSize: 13, color: "#2e3348" }}>Loading tasks…</p>
                    </div>
                  ) : fetchErr ? (
                    <div className="f-msg err">{fetchErr}</div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="task-empty">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 11v4m0 0h.01" />
                      </svg>
                      {tasks.length === 0 ? "No tasks yet. Add your first task →" : `No ${activeFilter} tasks found.`}
                    </div>
                  ) : (
                    <div className="task-list">
                      {filteredTasks.map((task) => (
                        <div className="task-item" key={task._id}>
                          <div className="task-item-top">
                            <div>
                              <div className="task-title">{task.title}</div>
                              {task.description && (
                                <div className="task-desc">{task.description}</div>
                              )}
                            </div>
                            <div className="task-actions">
                              <button
                                className="btn-icon btn-edit"
                                title="Edit task"
                                onClick={() => startEdit(task)}
                                id={`edit-task-${task._id}`}
                              >
                                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                className="btn-icon btn-delete"
                                title="Delete task"
                                disabled={deletingId === task._id}
                                onClick={() => requestDelete(task._id)}
                                id={`delete-task-${task._id}`}
                              >
                                {deletingId === task._id ? (
                                  <svg className="spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                                    <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 11v6m4-6v6" strokeLinecap="round" />
                                    <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="task-meta">
                            <Badge label={task.status || "Pending"} colorMap={STATUS_COLOR} />
                            <Badge label={task.priority || "Medium"} colorMap={PRIORITY_COLOR} />
                            {task.createdAt && (
                              <span className="task-date">
                                {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Edit Task</span>
              <button className="modal-close" onClick={() => setEditId(null)} aria-label="Close">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="f-group">
                  <label className="f-label" htmlFor="edit-title">Title *</label>
                  <input
                    id="edit-title"
                    className="f-input"
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    className="f-textarea"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="f-row">
                  <div className="f-group" style={{ marginBottom: 0 }}>
                    <label className="f-label" htmlFor="edit-priority">Priority</label>
                    <select
                      id="edit-priority"
                      className="f-select"
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    >
                      {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="f-group" style={{ marginBottom: 0 }}>
                    <label className="f-label" htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
                      className="f-select"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditId(null)}>Cancel</button>
                <button id="save-task-btn" type="submit" className="btn-save" disabled={editSubmitting}>
                  {editSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirmDeleteId && (
        <div className="confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteId(null); }}>
          <div className="confirm-box">
            <div className="confirm-icon">
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11v6m4-6v6" strokeLinecap="round" />
                <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="confirm-title">Delete this task?</div>
            <div className="confirm-sub">This action cannot be undone. The task will be permanently removed.</div>
            <div className="confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button id="confirm-delete-btn" className="btn-confirm-delete" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </>
  );
}
