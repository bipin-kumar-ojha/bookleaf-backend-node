# BookLeaf Author Support & Communication Portal

An AI-assisted support portal for BookLeaf Publishing with two interfaces: an **Author Portal** (books, royalties, support tickets) and an **Admin Portal** (ticket queue, AI classification, AI-drafted replies, ticket management).

- **Live demo:** `[add deployed URL]`
- **API docs:** see [API Documentation](#api-documentation)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Getting Started (Local Setup)](#getting-started-local-setup)
6. [Environment Variables](#environment-variables)
7. [Seeding the Database](#seeding-the-database)
8. [Test Credentials](#test-credentials)
9. [AI Integration](#ai-integration)
10. [Real-Time Updates](#real-time-updates)
11. [API Documentation](#api-documentation)
12. [Security](#security)
13. [Edge Cases Handled](#edge-cases-handled)
14. [Known Limitations](#known-limitations)
15. [Future Improvements](#future-improvements)

---

## Features

### Author Portal
- Email/password login; authors only ever see their own data.
- Auth persists across page refresh (token stored client-side + `AuthGuard`).
- **Submit a Support Query** (left panel): select a book (or *General / Account Level*), subject, description, and an optional file attachment field (UI only, not functional).
- **Support History** tab: every ticket with author, status, related book, AI priority, AI classification, description, admin replies and creation date.
- **My Books** tab: book name, author name, MRP, ISBN, publication date, copies sold, royalty summary (total earned / paid / pending) and the platforms the book is available on.
- Near real-time updates: status changes and admin replies appear within about 5 seconds, without refreshing.

### Admin Portal
- Role-based redirect after login (admin → admin dashboard, author → author dashboard).
- Header with BookLeaf logo, admin name and logout; sidebar with **All Tickets** and **All Users**.
- **All Tickets**
  - Summary cards: Total Volume, Requires Attention, In Progress, Successfully Resolved.
  - Filters: search, status, category, priority, from/to date, and a reset button.
  - Two-column layout: ticket list (short details) + ticket detail panel.
  - Detail panel: subject, description, author information, related book with ISBN.
  - **AI Classification** and **AI Priority** shown with an *AI* badge; admin can override both via **Edit Details**.
  - **AI Draft Response**: a complete draft is generated when the ticket is created; the admin can edit it and send it. Sent replies are tracked as history and shown on the author's ticket view.
  - **Internal notes** visible to admins only.
  - **Assign ticket** to an admin (only admin users can be assignees).
  - Status updates: Open, In Progress, Resolved, Closed.
- **All Users**: lists all seeded users (from the provided JSON dataset) and lets admins add new authors and admins.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| AI | OpenAI (`gpt-6-luna`) |
| Auth | Token-based (JWT), email + password |
| Real-time | Short polling (`setInterval`, ~5 seconds) |

### Why this AI model?
Free-tier Gemini was tried first but was slow and frequently returned "high demand" errors, which blocked ticket creation during testing. Moving to a paid OpenAI model removed the downtime, gave consistently fast responses and allowed multiple tickets to be created back to back without interruption. The model name is read from an environment variable (`OPENAI_MODEL`), so it can be swapped without code changes.

---

## Architecture

```
┌──────────────────┐   REST/JSON + token   ┌────────────────────┐        ┌──────────┐
│ bookleaf-frontend│ ────────────────────▶ │ bookleaf-backend   │ ─────▶ │ MongoDB  │
│ (Next.js)        │ ◀──────────────────── │ (Express)          │ ◀───── │          │
│ Author / Admin   │   polling (every 5s)  │ routes → middleware│        └──────────┘
└──────────────────┘                       │ → controllers      │        ┌──────────┐
                                           │ → AI service ──────┼──────▶ │ OpenAI   │
                                           └────────────────────┘        └──────────┘
```

Key decisions:

- **Separate frontend and backend apps** in one parent folder, so each can be run, built and deployed independently.
- **Layered backend** (routes → auth middleware → controllers → services): HTTP routing is separated from business logic and from the AI service, so the AI provider can be replaced by editing a single module.
- **AI runs server-side only.** The API key never reaches the browser.
- **Ticket creation never depends on the AI.** If the AI call fails, the ticket is still saved.
- **One AI call per ticket** returns classification, priority and the draft response together, instead of three separate calls.
- **Role-based access control** is enforced on the server (auth middleware + admin-only middleware), not just in the UI.
- **Short polling** was chosen over WebSockets/SSE for simplicity and reliability on any hosting platform.

---

## Project Structure

Both apps live inside one parent folder:

```
Bookleaf publishing 2026/
├── bookleaf-backend/          # Express API
│   ├── config/                # Database connection (db.js)
│   ├── controllers/           # authController, booksController,
│   │                          # ticketsController, usersController
│   ├── middleware/            # authMiddleware (token verification)
│   ├── models/                # Mongoose schemas (users, books, tickets)
│   ├── routes/                # auth, books, tickets, users
│   ├── services/              # AI service (OpenAI ticket analysis)
│   ├── server.js              # App entry point
│   ├── .env                   # Secrets (git-ignored)
│   └── package.json
│
├── bookleaf-frontend/         # Next.js app
│   ├── app/ (or pages/)       # Login, author dashboard, admin dashboard
│   ├── components/            # Ticket form, ticket list, filters, book cards
│   ├── ...
│   ├── .env.local             # Frontend config (git-ignored)
│   └── package.json
│
└── README.md
```

> Folder names inside each app are indicative; adjust to match the repository exactly (for example the entry file name and model file names).

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js 18+
- MongoDB (local instance or MongoDB Atlas connection string)
- An OpenAI API key

### 1. Clone
```bash
git clone <your-repo-url>
cd "Bookleaf publishing 2026"
```

### 2. Backend
```bash
cd bookleaf-backend
npm install
# create a .env file (see Environment Variables below)
npm run dev        # or: node server.js
```
The API starts on `http://localhost:5001` by default.

### 3. Frontend
```bash
cd bookleaf-frontend
npm install
# create a .env.local file (see Environment Variables below)
npm run dev
```
The UI starts on `http://localhost:3000`.

---

## Environment Variables

### Backend (`bookleaf-backend/.env`)
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/bookleaf   # use the variable name your db.js reads
JWT_SECRET=change-me                            # use the variable name your auth code reads
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-6-luna
```

### Frontend (`bookleaf-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

> The OpenAI key lives **only** in the backend environment. It is never prefixed with `NEXT_PUBLIC_`, never committed, and never sent to the browser. `.env` files are git-ignored.

---

## Seeding the Database

The database is seeded from the provided `bookleaf_sample_data.json` (10 authors, 18 books). Author users are created from this dataset and linked to their books, and admin accounts are available for the admin portal.

```bash
cd bookleaf-backend
node <your-seed-script>.js     # replace with your actual seed command
```

The dataset intentionally includes varied cases: published books earning royalties, pending payouts, zero payouts, and books still in production.

---

## Test Credentials

> Fill in with the real seeded accounts.

| Role | Email | Password |
|---|---|---|
| Admin | `[admin email]` | `[password]` |
| Author | `[author email]` | `[password]` |
| Author | `[author email]` | `[password]` |

---

## AI Integration

All AI logic lives in `bookleaf-backend/services/` (`generateTicketAnalysis`).

### 1. What the AI does
When an author creates a ticket, the backend makes **one** call to the model, which returns a JSON object with three fields:

| Field | Description |
|---|---|
| `category` | One of: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, Legal & Copyright, Marketing & Promotions, Formatting Issues, General Inquiry |
| `priority` | Critical / High / Medium / Low |
| `draftResponse` | A complete, empathetic draft reply for the admin to review |

The results are stored on the ticket. When an admin opens the ticket, the draft is already there, ready to edit and send. Admins can override the AI category and priority; the UI keeps the AI badge on AI-generated values.

### 2. Prompt strategy
- **Role framing:** the model is told it is an AI assistant for BookLeaf Publishing support.
- **Condensed Knowledge Base** embedded in the prompt: royalty policy (80/20 split, quarterly payouts within 45 days, ₹1,000 minimum threshold), ISBN policy (errors are high priority), printing (5–7 business days, photos + free reprint for defects), distribution (Amazon India, Flipkart, US, UK; stock sync fixes in 24–48 hours).
- **Tone guidelines:** empathetic and professional, specific numbers/dates, own BookLeaf's faults, clear next steps.
- **Strict output contract:** the model must reply only with valid JSON containing exactly `category`, `priority` and `draftResponse`, with allowed values listed explicitly. This is enforced with `response_format: { type: 'json_object' }`.
- The response is parsed server-side; an empty or invalid response is treated as a failure and handled by the fallback logic below.

### 3. Cost awareness
- **Only the ticket subject and description** are sent to the model, never ticket history or other database records.
- The Knowledge Base is a **condensed summary** of the key policies rather than the full document, keeping prompt size small.
- **One call per ticket** produces classification, priority and the draft together, instead of three separate calls.
- Results are **stored once** at creation. Opening, filtering or re-viewing a ticket never triggers another paid AI call.

### 4. Error handling & graceful degradation
If the AI provider is down, slow, rate-limited or returns invalid output:
- the AI call is wrapped in error handling so the **API does not crash**;
- the **ticket is still created** and saved;
- the admin can still open the ticket and **write the reply manually**.

### 5. API key security
- Key read from `process.env.OPENAI_API_KEY` on the server only.
- Not hardcoded, not in the repo, not exposed to the frontend.

---

## Real-Time Updates

The author dashboard uses **short polling** with `setInterval()` to re-fetch the author's tickets, with a maximum delay of about **5 seconds**. When an admin changes a status or sends a reply, the author sees it without refreshing the page. The interval is cleared on unmount/logout to avoid leaks.

**Trade-off:** polling is simple and works on any hosting platform, but is less efficient than WebSockets/SSE at large scale.

---

## API Documentation

Base URL: `/api`. All routes except `POST /auth/login` are protected by the auth middleware and require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with email + password; returns token and user details including role |

### Books
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/books` | Authenticated | Returns books with royalty and sales details (authors receive only their own books) |

### Tickets
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/tickets` | Author | Create a ticket; triggers AI classification, priority and draft response |
| GET | `/api/tickets` | Authenticated | Fetch tickets by role: authors get their own, admins get all (with filter support) |
| PUT | `/api/tickets/:id` | Admin | Update status, category/priority override, internal note, assigned admin, or draft |
| POST | `/api/tickets/:id/replies` | Admin | Send a reply to the author; appears in the author's ticket view |

### Users
All user routes are admin-only (`requireAdmin` middleware returns `403` otherwise).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create an author or admin |
| PUT | `/api/users/:id` | Admin | Update a user |
| DELETE | `/api/users/:id` | Admin | Delete a user |

### Health check
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Returns "BookLeaf API is running successfully!" |

### Example: create ticket
```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "<book id, or empty for General / Account Level>",
  "subject": "Royalty not received",
  "description": "I published 4 months ago and still haven't received any royalty."
}
```

The created ticket is returned with its AI-generated category, priority and draft response (or default values if the AI call failed).

### Error format
Errors return a JSON body with an `error` message and an appropriate HTTP status:

```json
{ "error": "Access denied. Admins only." }
```

| Code | Meaning |
|---|---|
| 400 | Invalid or missing input |
| 401 | Missing or invalid token |
| 403 | Authenticated but not allowed (wrong role) |
| 404 | Resource not found |
| 500 | Unexpected server error |

---

## Security

- Passwords are hashed (never stored in plain text).
- Auth middleware protects every route except login.
- Role-based access control: authors only access their own books and tickets; user management is admin-only through `requireAdmin`.
- Internal notes are never included in author-facing responses.
- Secrets live in environment variables only and are git-ignored.

---

## Edge Cases Handled

- Authors with no tickets or no books (empty states).
- Books still **in production** (no sales, no royalty yet).
- Books with **zero royalty paid** or fully pending royalty.
- "General / Account Level" tickets with no related book.
- AI failure (ticket still created, admin can reply manually).
- Page refresh keeps the user logged in.

---

## Known Limitations

- File attachment is UI only (not required by the assignment); files are not uploaded or stored.
- Authors cannot reply to admin responses (not in the requirements).
- The AI draft is generated once at ticket creation; there is no regenerate/retry button for admins yet.
- The AI prompt uses a condensed Knowledge Base and does not include the linked book's live data (status, royalty figures) in the draft.
- No request timeout, `max_tokens` cap or automatic retry on the AI call yet.
- Short polling is less efficient than WebSockets/SSE at scale.
- Statuses, priorities and categories are fixed values rather than configurable.

---

## Future Improvements

- **Author replies** on tickets for full two-way conversations.
- **File attachments** stored on AWS S3 (or similar) with signed URLs.
- **Admin "Regenerate draft" button** and automatic retry with backoff when the AI is unavailable.
- **Richer prompts:** include the linked book's real data (status, ISBN, royalty numbers) and few-shot examples, and add `max_tokens` and timeout limits.
- **Dynamic configuration:** admin-managed statuses, priorities and classification categories.
- **Fully dynamic RBAC** with custom roles/permissions and modular feature access.
- WebSockets/SSE for true real-time updates, plus email/Slack notifications for critical tickets.
- SLA timers and auto-escalation for aging tickets.
- Analytics (resolution time, category trends, AI accuracy vs. admin overrides).
- Automated tests and CI/CD.

---

## Author

`[Your Name]` — `[email / LinkedIn / GitHub]`