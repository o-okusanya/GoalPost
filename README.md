# GoalPost Backend

Node.js + Express + PostgreSQL REST API for GoalPost.

---

## Setup

### 1. Install PostgreSQL
If you don't have it: https://www.postgresql.org/download/

Create a database:
```bash
psql -U postgres
CREATE DATABASE goalpost;
\q
```

### 2. Run the schema
```bash
psql -U postgres -d goalpost -f schema.sql
```

### 3. Install dependencies
```bash
npm install
```

### 4. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in your database password and a random JWT secret:
```
DB_PASSWORD=your_postgres_password
JWT_SECRET=some_long_random_string_at_least_32_chars
```

### 5. Start the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:4000` by default.

---

## API Reference

### Auth
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | `{ firstName, lastName, email, password }` | Create account |
| POST | `/auth/login` | `{ email, password }` | Login, returns JWT token |

Both return: `{ token, user: { id, fullName, email } }`

---

### Goals
All routes require `Authorization: Bearer <token>` header.

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/goals` | — | Get all your goals |
| POST | `/goals` | `{ name, genre, type, folderId? }` | Create a goal |
| PATCH | `/goals/:id` | `{ name?, genre?, folderId?, progress?, checked? }` | Update a goal |
| DELETE | `/goals/:id` | — | Delete a goal |

---

### Folders
All routes require `Authorization: Bearer <token>` header.

| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/folders` | — | Get all your folders |
| POST | `/folders` | `{ name }` | Create a folder |
| DELETE | `/folders/:id` | — | Delete folder (goals move to no folder) |

---

## Connecting your frontend

Replace localStorage calls in `goalpost.html` with `fetch()` calls to this API.

**Example — login:**
```js
const res  = await fetch("http://localhost:4000/auth/login", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({ email, password }),
});
const data = await res.json();
// Store the token
localStorage.setItem("gp_token", data.token);
```

**Example — fetch goals:**
```js
const token = localStorage.getItem("gp_token");
const res   = await fetch("http://localhost:4000/goals", {
  headers: { Authorization: `Bearer ${token}` },
});
const goals = await res.json();
```

**Example — create a goal:**
```js
await fetch("http://localhost:4000/goals", {
  method:  "POST",
  headers: {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({ name, genre, type, folderId }),
});
```
