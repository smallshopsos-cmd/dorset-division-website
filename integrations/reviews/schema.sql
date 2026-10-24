CREATE TABLE IF NOT EXISTS reviews (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 business TEXT,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
 review TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews(status,created_at DESC);
