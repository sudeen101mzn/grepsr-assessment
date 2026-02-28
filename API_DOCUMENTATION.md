# API Documentation

Base URL: `http://localhost:5000`

## Endpoints

### 1. Shorten a URL

**POST** `/shorten`

Accepts a long URL and returns a shortened alias.

**Request Body:**

```json
{
  "url": "https://www.example.com"
}
```

**Success Response (201 Created):**

```json
{
  "alias": "88a525",
  "short_url": "http://localhost:5000/88a525",
  "original_url": "https://www.example.com"
}
```

**Rate Limit Exceeded (429 Too Many Requests):**

```json
{
  "error": "Rate limit exceeded. Try again later.",
  "retry_after_seconds": 45
}
```

**Bad Request (400):**

```json
{
  "error": "URL must start with http:// or https://"
}
```

### 2. Redirect to Original URL

**GET** `/{alias}`

Redirects the user to the original URL and records a click with a timestamp.

**Example:** `GET /88a525`

**Success Response:** `302 Redirect` to the original URL

**Not Found (404):**

```json
{
  "error": "URL not found"
}
```

### 3. Get All Shortened URLs

**GET** `/urls`

Returns a list of all shortened URLs.

**Success Response (200 OK):**

```json
[
  {
    "alias": "88a525",
    "original_url": "https://www.example.com",
    "created_at": "2026-02-26 03:51:16"
  },
  {
    "alias": "3f9a12",
    "original_url": "https://www.google.com",
    "created_at": "2026-02-26 04:10:22"
  }
]
```

### 4. Get Analytics for a URL

**GET** `/analytics/{alias}`

Returns click counts grouped by day for the last 7 days.

**Example:** `GET /analytics/88a525`

**Success Response (200 OK):**

```json
{
  "alias": "88a525",
  "original_url": "https://www.example.com",
  "clicks_last_7_days": [
    { "day": "2026-02-22", "count": 3 },
    { "day": "2026-02-24", "count": 7 },
    { "day": "2026-02-26", "count": 12 }
  ]
}
```

**Not Found (404):**

```json
{
  "error": "URL not found"
}
```

## Rate Limiting

- Limit: **5 requests per minute** per IP address
- Applies to: `POST /shorten` only
- Exceeding the limit returns `429 Too Many Requests` with `retry_after_seconds`
