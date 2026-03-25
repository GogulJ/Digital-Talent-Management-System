import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0e;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          position: relative;
          overflow: hidden;
          background: #111;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(212,175,55,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 10%, rgba(212,175,55,0.07) 0%, transparent 60%);
          pointer-events: none;
        }

        .login-left-noise {
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

        .left-desc {
          font-size: 14px;
          color: #6b6558;
          line-height: 1.7;
          max-width: 320px;
          font-weight: 300;
        }

        .left-divider {
          width: 40px;
          height: 1px;
          background: rgba(212,175,55,0.35);
          margin: 24px 0;
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
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f5f0;
          padding: 48px 40px;
          position: relative;
        }

        .login-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(212,175,55,0.3) 40%, rgba(212,175,55,0.3) 60%, transparent);
        }

        .login-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .form-heading {
          margin-bottom: 36px;
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

        /* Error */
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
          margin-bottom: 24px;
        }

        /* Fields */
        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a4640;
          margin-bottom: 8px;
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

        .field-input::placeholder {
          color: #c5bfb6;
        }

        .field-input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
        }

        .field-input.has-toggle {
          padding-right: 44px;
        }

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

        /* Submit */
        .submit-btn {
          width: 100%;
          margin-top: 8px;
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
          margin: 24px 0;
        }

        .form-divider-line {
          flex: 1;
          height: 1px;
          background: #e0dbd2;
        }

        .form-divider-text {
          font-size: 11px;
          color: #b5b0a8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

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
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right {
            min-height: 100vh;
            background: #0e0e0e;
            padding: 48px 24px;
          }
          .login-right::before { display: none; }
          .form-title { color: #f0ebe0; }
          .form-eyebrow { color: #d4af37; }
          .form-subtitle { color: #6b6558; }
          .form-footer { color: #6b6558; }
          .form-footer a { color: #d4af37; text-decoration-color: rgba(212,175,55,0.4); }
          .field-label { color: #9a9590; }
          .field-input { background: #1a1814; border-color: #2e2b26; color: #f0ebe0; }
          .field-input:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
          .submit-btn { background: #d4af37; color: #0e0e0e; }
          .submit-btn:hover:not(:disabled) { background: #c9a42e; }
          .toggle-btn { color: #6b6558; }
        }
      `}</style>

      <div className="login-root">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-left-noise" />

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
              Everything you need,<br /><em>right where</em><br />you left it.
            </h2>
            <div className="left-divider" />
            <p className="left-desc">
              A workspace built for clarity. Sign in to pick up where you left off — your projects, your settings, your flow.
            </p>
          </div>

          <p className="left-footnote">© 2025 Talent Management System Inc. — All rights reserved</p>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="login-form-wrap">
            <div className="form-heading">
              <p className="form-eyebrow">Welcome back</p>
              <h1 className="form-title">Sign in</h1>
              <p className="form-subtitle">Enter your credentials to continue</p>
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

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label" htmlFor="login-email">Email address</label>
                <div className="field-box">
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    className="field-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="login-password">Password</label>
                <div className="field-box">
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    className="field-input has-toggle"
                    autoComplete="current-password"
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
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <svg className="spin" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
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
              Don't have an account?{" "}
              <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
