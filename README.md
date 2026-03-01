# URL Shortener with Analytics

A full-stack web application that shortens URLs, tracks clicks, and visualizes analytics. Built with Flask (Python) backend and React frontend.

## Features

- Shorten long URLs to 6-character aliases
- Track clicks with timestamps
- Analytics dashboard with a 7-day line chart
- Custom rate limiter (5 requests per minute per IP)
- Countdown timer on the frontend when rate limit is exceeded
- Fully containerized with Docker

## Project Structure

```
grepsr/
├── backend/
│   ├── app.py              # Flask routes
│   ├── database.py         # SQLite setup and connection
│   ├── rate_limiter.py     # Custom rate limiting logic
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── UrlShortener.jsx
│   │   │   └── Dashboard.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## How to Run

### Option 1: Using Docker (Recommended)

Make sure Docker Desktop is installed and running, then:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

To stop:

```bash
docker compose down
```

### Option 2: Running Manually

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend** (in a separate terminal):

```bash
cd frontend
npm install
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## How the Rate Limiter Works

The rate limiter uses a **Fixed Window** algorithm implemented from scratch without any third-party libraries.

**Logic:**

- An in-memory dictionary stores each IP address mapped to a list of request timestamps: `{ "192.168.1.1": [timestamp1, timestamp2, ...] }`
- On every request to `POST /shorten`, the current timestamp is recorded for that IP
- Timestamps older than 60 seconds are removed from the list
- If the remaining count is 5 or more, the request is blocked with a `429 Too Many Requests` response
- The response includes a `retry_after_seconds` field indicating how long until the oldest request expires and a new request is allowed

**Example 429 response:**

```json
{
  "error": "Rate limit exceeded. Try again later.",
  "retry_after_seconds": 45
}
```

The frontend reads `retry_after_seconds` and displays a live countdown timer so the user knows exactly when they can try again.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Flask, SQLite |
| Frontend | React, Chart.js, Axios |
| Containerization | Docker, Docker Compose |
