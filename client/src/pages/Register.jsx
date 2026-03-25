import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/api/auth/register", form);
      setSuccess(res.data.msg + " Redirecting to login…");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    return s; // 1=weak 2=fair 3=strong
  })();

  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];
  const strengthColor = ["", "#c0392b", "#d4a017", "#2e7d32"][strength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0e;
        }

        /* ── LEFT PANEL ── */
        .reg-left {
          position: relative;
          overflow: hidden;
          background: #111;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
        }

        .reg-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(212,175,55,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 10%, rgba(212,175,55,0.07) 0%, transparent 60%);
          pointer-events: none;
        }

        .reg-noise {
          position: absolute;
          inset: 0;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
          pointer-events: none;
        }

        .left-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .left-brand-mark {
          width: 36px;
          height: 36px;
          border: 1.5px solid rgba(212,175,55,0.6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .left-brand-mark svg {
          width: 18px;
          height: 18px;
          stroke: #d4af37;
        }

        .left-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          color: #e8e0cc;
          letter-spacing: 0.02em;
        }

        .left-hero {
          position: relative;
          z-index: 1;
        }

        .left-tagline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 500;
          color: #f0ebe0;
          line-height: 1.25;
          margin-bottom: 20px;
        }

        .left-tagline em {
          font-style: italic;
          color: #d4af37;
        }

        .left-divider {
          width: 40px;
          height: 1px;
          background: rgba(212,175,55,0.35);
          margin: 24px 0;
        }

        .left-desc {
          font-size: 14px;
          color: #6b6558;
          line-height: 1.7;
          max-width: 320px;
          font-weight: 300;
        }

        /* Steps list */
        .steps-list {
          list-style: none;
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid rgba(212,175,55,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 500;
          color: #d4af37;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .step-text {
          font-size: 13px;
          color: #5a5550;
          line-height: 1.5;
          font-weight: 300;
        }

        .left-footnote {
          font-size: 12px;
          color: #3d3a35;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }

        /* ── RIGHT PANEL ── */
        .reg-right {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f5f0;
          padding: 48px 40px;
          position: relative;
        }

        .reg-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(212,175,55,0.3) 40%, rgba(212,175,55,0.3) 60%, transparent);
        }

        .reg-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .form-heading {
          margin-bottom: 32px;
        }

        .form-eyebrow {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #d4af37;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 500;
          color: #1a1814;
          line-height: 1.2;
        }

        .form-subtitle {
          font-size: 13.5px;
          color: #8a857a;
          margin-top: 8px;
          font-weight: 300;
        }

        /* Alerts */
        .form-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff0f0;
          border: 1px solid #f5c0c0;
          border-left: 3px solid #c0392b;
          color: #8b2020;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .form-success {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f0f9f0;
          border: 1px solid #b8e0b8;
          border-left: 3px solid #2e7d32;
          color: #1b5e20;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        /* Fields */
        .field-group {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a4640;
          margin-bottom: 7px;
        }

        .field-box {
          position: relative;
        }

        .field-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid #e0dbd2;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1814;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-input::placeholder { color: #c5bfb6; }

        .field-input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
        }

        .field-input.has-toggle { padding-right: 44px; }

        .toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #a09890;
          display: flex;
          align-items: center;
        }
        .toggle-btn:hover { color: #4a4640; }

        /* Password strength */
        .strength-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .strength-bars {
          display: flex;
          gap: 3px;
          flex: 1;
        }

        .strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: #e0dbd2;
          transition: background 0.3s;
        }

        .strength-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.04em;
          min-width: 36px;
          text-align: right;
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          margin-top: 6px;
          padding: 13px 20px;
          background: #1a1814;
          color: #f0ebe0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .submit-btn:hover:not(:disabled)::after { opacity: 1; }
        .submit-btn:hover:not(:disabled) { background: #2a2620; transform: translateY(-1px); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .form-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
        }
        .form-divider-line { flex: 1; height: 1px; background: #e0dbd2; }
        .form-divider-text { font-size: 11px; color: #b5b0a8; text-transform: uppercase; letter-spacing: 0.08em; }

        /* Footer */
        .form-footer {
          text-align: center;
          font-size: 13.5px;
          color: #8a857a;
        }

        .form-footer a {
          color: #1a1814;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(212,175,55,0.5);
          transition: text-decoration-color 0.2s, color 0.2s;
        }
        .form-footer a:hover {
          color: #d4af37;
          text-decoration-color: #d4af37;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .reg-root { grid-template-columns: 1fr; }
          .reg-left { display: none; }
          .reg-right {
            min-height: 100vh;
            background: #0e0e0e;
            padding: 48px 24px;
          }
          .reg-right::before { display: none; }
          .form-title { color: #f0ebe0; }
          .form-eyebrow { color: #d4af37; }
          .form-subtitle { color: #6b6558; }
          .form-footer { color: #6b6558; }
          .form-footer a { color: #d4af37; text-decoration-color: rgba(212,175,55,0.4); }
          .field-label { color: #9a9590; }
          .field-input { background: #1a1814; border-color: #2e2b26; color: #f0ebe0; }
          .field-input:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
          .strength-bar { background: #2e2b26; }
          .submit-btn { background: #d4af37; color: #0e0e0e; }
          .submit-btn:hover:not(:disabled) { background: #c9a42e; }
          .toggle-btn { color: #6b6558; }
        }
      `}</style>

      <div className="reg-root">
        {/* Left panel */}
        <div className="reg-left">
          <div className="reg-noise" />

          <div className="left-brand">
            <div className="left-brand-mark">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="left-brand-name">Talent Management System</span>
          </div>

          <div className="left-hero">
            <h2 className="left-tagline">
              Start with<br /><em>a blank</em><br />canvas.
            </h2>
            <div className="left-divider" />
            <p className="left-desc">
              Set up your account in seconds. Everything is ready the moment you walk in.
            </p>
            <ul className="steps-list">
              <li className="step-item">
                <span className="step-num">1</span>
                <span className="step-text">Create your account with a name and email</span>
              </li>
              <li className="step-item">
                <span className="step-num">2</span>
                <span className="step-text">Set a secure password to protect your workspace</span>
              </li>
              <li className="step-item">
                <span className="step-num">3</span>
                <span className="step-text">Sign in and pick up where you want to begin</span>
              </li>
            </ul>
          </div>

          <p className="left-footnote">© 2025 Talent Management System Inc. — All rights reserved</p>
        </div>

        {/* Right panel */}
        <div className="reg-right">
          <div className="reg-form-wrap">
            <div className="form-heading">
              <p className="form-eyebrow">Get started</p>
              <h1 className="form-title">Create account</h1>
              <p className="form-subtitle">Fill in the details below to join</p>
            </div>

            {error && (
              <div className="form-error">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="form-success">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label" htmlFor="register-name">Full name</label>
                <div className="field-box">
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    className="field-input"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="register-email">Email address</label>
                <div className="field-box">
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="field-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="register-password">Password</label>
                <div className="field-box">
                  <input
                    id="register-password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    className="field-input has-toggle"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" strokeLinecap="round"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password strength meter */}
                {form.password && (
                  <div className="strength-row">
                    <div className="strength-bars">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{ background: strength >= i ? strengthColor : undefined }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <button
                id="register-btn"
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <svg className="spin" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">or</span>
              <div className="form-divider-line" />
            </div>

            <p className="form-footer">
              Already have an account?{" "}
              <Link to="/">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
