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

## ✅ Sprint 2 – Task Management CRUD (COMPLETED)

### Day 1: Task Model & Create API
- Created `Task` model with Mongoose (title, description, status, priority, assignedTo, createdBy, dueDate fields)
- Implemented `taskController.js` with `createTask` function
- Set up `taskRoutes.js` with `POST /api/tasks`
- All task routes protected with `authMiddleware`

### Day 2: Full CRUD APIs
- `GET /api/tasks` — fetch all tasks with populated assignedTo & createdBy (sorted by newest)
- `GET /api/tasks/:id` — fetch a single task by ID with population
- `PUT /api/tasks/:id` — update task with validation (`runValidators: true`) + 404 handling
- `DELETE /api/tasks/:id` — delete task with 404 check + proper error responses

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
    │   ├── authController.js  # register + login logic
    │   └── taskController.js  # Task CRUD logic
    ├── middleware/
    │   └── authMiddleware.js  # JWT verification middleware
    ├── models/
    │   ├── User.js            # Mongoose User schema
    │   └── Task.js            # Mongoose Task schema
    ├── routes/
    │   ├── authRoutes.js      # /api/auth routes
    │   └── taskRoutes.js      # /api/tasks routes (protected)
    ├── server.js              # Express app entry point
    └── .env                   # MONGO_URI, JWT_SECRET, PORT
```

---

## 🔐 API Endpoints

### Auth Routes
| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/protected` | Yes (JWT) | Test protected access |

### Task Routes
| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| POST | `/api/tasks` | Yes (JWT) | Create a new task |
| GET | `/api/tasks` | Yes (JWT) | Get all tasks (populated) |
| GET | `/api/tasks/:id` | Yes (JWT) | Get a single task by ID |
| PUT | `/api/tasks/:id` | Yes (JWT) | Update a task |
| DELETE | `/api/tasks/:id` | Yes (JWT) | Delete a task |