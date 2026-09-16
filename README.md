# StudentHub — CRUD Learning Project

This project demonstrates the four CRUD operations required by the Web Development Minor Project:

- **Create** — add a student
- **Read** — list/search students
- **Update** — edit a student
- **Delete** — remove a student

## 1. Requirements

Install:
- Node.js
- MongoDB Community Server, or use a MongoDB Atlas connection

## 2. Backend setup

Open a terminal:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` in the project root and configure `MONGODB_URI`.

Then:

```bash
npm start
```

The API runs on `http://localhost:5000`.

## 3. Frontend

Open `frontend/index.html` with VS Code Live Server, or serve the frontend with any static HTTP server.

## 4. API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/students | Read all |
| GET | /api/students/:id | Read one |
| POST | /api/students | Create |
| PUT | /api/students/:id | Update |
| DELETE | /api/students/:id | Delete |

## 5. Learning path

Study these files in this order:

1. `frontend/index.html`
2. `frontend/css/style.css`
3. `frontend/js/app.js`
4. `backend/server.js`
5. `backend/models/Student.js`
6. `backend/routes/studentRoutes.js`
7. `backend/controllers/studentController.js`

### Important idea

The frontend does not directly modify MongoDB.

```text
HTML/CSS/JS
    ↓
fetch()
    ↓
Express REST API
    ↓
Controller
    ↓
Mongoose Model
    ↓
MongoDB
```

Start by understanding `GET`, then `POST`, then `PUT`, and finally `DELETE`.
