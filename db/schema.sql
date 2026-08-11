CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) BETWEEN 1 AND 100),
  email VARCHAR(320) NOT NULL CHECK (email = LOWER(email)),
  password_hash TEXT NOT NULL,
  profile_image BYTEA,
  profile_image_content_type VARCHAR(50),
  detection_count INTEGER NOT NULL DEFAULT 0 CHECK (detection_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (profile_image IS NULL AND profile_image_content_type IS NULL)
    OR (profile_image IS NOT NULL AND profile_image_content_type IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions (expires_at);
