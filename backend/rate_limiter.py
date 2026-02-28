# rate_limiter.py
import time

# In-memory store: { ip: [timestamp1, timestamp2, ...] }
request_log = {}

LIMIT = 5        # max requests
WINDOW = 60      # seconds

def is_rate_limited(ip: str) -> tuple[bool, int]:
    """
    Returns (is_limited, retry_after_seconds)
    """
    now = time.time()
    
    # Get existing timestamps for this IP, default to empty list
    timestamps = request_log.get(ip, [])
    
    # Remove timestamps outside the current 60-second window
    timestamps = [t for t in timestamps if now - t < WINDOW]
    
    if len(timestamps) >= LIMIT:
        # Calculate how many seconds until the oldest request expires
        oldest = timestamps[0]
        retry_after = int(WINDOW - (now - oldest)) + 1
        request_log[ip] = timestamps
        return True, retry_after
    
    # Not limited — log this request and allow it
    timestamps.append(now)
    request_log[ip] = timestamps
    return False, 0