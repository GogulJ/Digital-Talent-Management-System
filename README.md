# Digital Talent Management System

The Digital Talent Management System (DTMS) is a comprehensive platform designed to streamline the entire talent lifecycle within organizations. It integrates recruitment, onboarding, performance tracking, and career development into a unified digital solution, ensuring efficiency and transparency in workforce management.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |

---

## 🚀 Getting Started

### Backend
```bash
cd server
npm install
# Add your MONGO_URI and JWT_SECRET to .env
node server.js
```

### Frontend
```bash
cd client
npm install
npm run dev
```

---

## ✅ Sprint 1 – Authentication System (COMPLETED)

### Day 1–2: Project Setup
- Initialized MERN project structure (client + server)
- Installed all backend dependencies (express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv)
- Installed frontend dependencies (React, React Router, Axios, Tailwind CSS)

### Day 3: Backend Auth
- Created `User` model with Mongoose (name, email, password, role fields)
- Implemented `authController.js` with `register` and `login` functions
- Password hashing with bcryptjs (10 salt rounds)
- JWT token generation on login (expires in 1 day)
- Created auth routes: `POST /api/auth/register`, `POST /api/auth/login`

### Day 4: Frontend ↔ Backend Connection
- Configured Axios instance (`src/services/api.js`) using `VITE_API_URL`
- Connected Register form to `POST /api/auth/register`
- Connected Login form to `POST /api/auth/login` with token stored in `localStorage`

### Day 5: JWT Security + Finalization
- Created `middleware/authMiddleware.js` — verifies JWT on protected routes
- Added `GET /api/protected` protected route (requires valid token in header)
- Polished UI: loading spinners, inline error/success messages, glassmorphism design
- Added `src/utils/auth.js` with helpers: `fetchProtected`, `logout`, `getUser`, `isLoggedIn`
- Added auto-redirect to login after successful registration

---

## 📁 Project Structure

```
Digital-Talent-System/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login page with JWT handling
│   │   │   └── Register.jsx   # Register page with validation
│   │   ├── services/
│   │   │   └── api.js         # Axios instance
│   │   └── utils/
│   │       └── auth.js        # Auth helpers (logout, getUser, etc.)
│   └── .env                   # VITE_API_URL
└── server/                    # Node/Express backend
    ├── controllers/
    │   └── authController.js  # register + login logic
    ├── middleware/
    │   └── authMiddleware.js  # JWT verification middleware
    ├── models/
    │   └── User.js            # Mongoose User schema
    ├── routes/
    │   └── authRoutes.js      # /api/auth routes
    ├── server.js              # Express app entry point
    └── .env                   # MONGO_URI, JWT_SECRET, PORT
```

---

## 🔐 API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/protected` | Yes (JWT) | Test protected access |