# In app.py (helper function)
import hashlib
import time

def generate_alias(url: str) -> str:
    raw = f"{url}{time.time()}"
    hash_value = hashlib.md5(raw.encode()).hexdigest()
    return hash_value[:6]

# app.py
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from database import init_db, get_connection
from rate_limiter import is_rate_limited
import hashlib
import time

app = Flask(__name__)
CORS(app)  # allows frontend to call this API

# Initialize DB on startup
init_db()

def generate_alias(url: str) -> str:
    raw = f"{url}{time.time()}"
    return hashlib.md5(raw.encode()).hexdigest()[:6]


# ─────────────────────────────────────────
# ENDPOINT 1: Shorten a URL
# POST /shorten
# Body: { "url": "https://example.com" }
# ─────────────────────────────────────────
@app.route("/shorten", methods=["POST"])
def shorten_url():
    ip = request.remote_addr
    
    # Check rate limit first
    limited, retry_after = is_rate_limited(ip)
    if limited:
        return jsonify({
            "error": "Rate limit exceeded. Try again later.",
            "retry_after_seconds": retry_after
        }), 429
    
    data = request.get_json()
    
    # Validate input
    if not data or not data.get("url"):
        return jsonify({"error": "URL is required"}), 400
    
    original_url = data["url"].strip()
    
    # Basic URL validation
    if not original_url.startswith(("http://", "https://")):
        return jsonify({"error": "URL must start with http:// or https://"}), 400
    
    alias = generate_alias(original_url)
    
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO urls (alias, original_url) VALUES (?, ?)",
            (alias, original_url)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": "Could not save URL"}), 500
    
    conn.close()
    
    return jsonify({
        "alias": alias,
        "short_url": f"http://localhost:5000/{alias}",
        "original_url": original_url
    }), 201


# ─────────────────────────────────────────
# ENDPOINT 2: Redirect to original URL
# GET /{alias}
# ─────────────────────────────────────────
@app.route("/<alias>", methods=["GET"])
def redirect_url(alias):
    conn = get_connection()
    row = conn.execute(
        "SELECT original_url FROM urls WHERE alias = ?", (alias,)
    ).fetchone()
    
    if not row:
        conn.close()
        return jsonify({"error": "URL not found"}), 404
    
    # Record the click with a timestamp
    conn.execute(
        "INSERT INTO clicks (alias) VALUES (?)", (alias,)
    )
    conn.commit()
    conn.close()
    
    return redirect(row["original_url"], code=302)


# ─────────────────────────────────────────
# ENDPOINT 3: Get all shortened URLs
# GET /urls
# ─────────────────────────────────────────
@app.route("/urls", methods=["GET"])
def get_all_urls():
    conn = get_connection()
    rows = conn.execute(
        "SELECT alias, original_url, created_at FROM urls ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    
    urls = [dict(row) for row in rows]
    return jsonify(urls), 200


# ─────────────────────────────────────────
# ENDPOINT 4: Get analytics for one URL
# GET /analytics/{alias}
# ─────────────────────────────────────────
@app.route("/analytics/<alias>", methods=["GET"])
def get_analytics(alias):
    conn = get_connection()
    
    # Check alias exists
    url_row = conn.execute(
        "SELECT original_url FROM urls WHERE alias = ?", (alias,)
    ).fetchone()
    
    if not url_row:
        conn.close()
        return jsonify({"error": "URL not found"}), 404
    
    # Get clicks grouped by day for the last 7 days
    rows = conn.execute("""
        SELECT DATE(clicked_at) as day, COUNT(*) as count
        FROM clicks
        WHERE alias = ?
        AND clicked_at >= DATE('now', '-7 days')
        GROUP BY DATE(clicked_at)
        ORDER BY day ASC
    """, (alias,)).fetchall()
    
    conn.close()
    
    clicks_by_day = [{"day": row["day"], "count": row["count"]} for row in rows]
    
    return jsonify({
        "alias": alias,
        "original_url": url_row["original_url"],
        "clicks_last_7_days": clicks_by_day
    }), 200


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)