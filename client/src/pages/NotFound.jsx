import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nf-root {
          min-height: 100vh;
          background: #0b0b0f;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 32px;
          color: #e2e0f0;
        }

        .nf-code {
          font-family: 'Playfair Display', serif;
          font-size: clamp(5rem, 15vw, 9rem);
          font-weight: 500;
          line-height: 1;
          background: linear-gradient(135deg, #d4af37, #b8882e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .nf-title {
          font-size: 1.3rem;
          color: #94a0b8;
          margin-top: 12px;
          font-weight: 300;
        }

        .nf-desc {
          font-size: 14px;
          color: #3d4258;
          margin-top: 10px;
          max-width: 340px;
          line-height: 1.7;
        }

        .nf-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 36px;
          padding: 11px 24px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.3);
          color: #d4af37;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s, border-color 0.2s;
        }
        .nf-link:hover { background: rgba(212,175,55,0.18); border-color: rgba(212,175,55,0.5); }
      `}</style>

      <div className="nf-root">
        <div className="nf-code">404</div>
        <p className="nf-title">Page not found</p>
        <p className="nf-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="nf-link">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
