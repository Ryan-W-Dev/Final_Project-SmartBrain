import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const localDatabaseUrl = 'postgresql://smartbrain:smartbrain@localhost:5432/smartbrain';
const connectionString = process.env.DATABASE_URL || localDatabaseUrl;
const useSsl = process.env.DATABASE_SSL === 'true';

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production.');
}

const pool = new Pool({
  connectionString,
  max: 10,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

const rankedUserQuery = `
  WITH ranked_users AS (
    SELECT
      id,
      name,
      email,
      detection_count,
      profile_image_content_type,
      ROW_NUMBER() OVER (
        ORDER BY detection_count DESC, created_at ASC, id ASC
      )::INTEGER AS rank
    FROM users
  )
  SELECT id, name, email, detection_count, profile_image_content_type, rank
  FROM ranked_users
  WHERE id = $1
`;

export const initializeDatabase = async () => {
  const schemaPath = fileURLToPath(new URL('./db/schema.sql', import.meta.url));
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
};

export const createUser = async ({ email, name, passwordHash, profileImage }) => {
  const result = await pool.query(
    `
      INSERT INTO users (
        name,
        email,
        password_hash,
        profile_image,
        profile_image_content_type
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [name, email, passwordHash, profileImage?.image || null, profileImage?.contentType || null]
  );

  return getUserById(result.rows[0].id);
};

export const findUserCredentialsByEmail = async (email) => {
  const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1 LIMIT 1', [
    email,
  ]);

  return result.rows[0] || null;
};

export const getUserById = async (userId) => {
  const result = await pool.query(rankedUserQuery, [userId]);
  return result.rows[0] || null;
};

export const createSession = async ({ tokenHash, userId, expiresAt }) => {
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
  await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
    tokenHash,
    userId,
    expiresAt,
  ]);
};

export const deleteSession = async (tokenHash) => {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
};

export const getUserBySession = async (tokenHash) => {
  const result = await pool.query(
    `
      SELECT user_id
      FROM sessions
      WHERE token_hash = $1 AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] ? getUserById(result.rows[0].user_id) : null;
};

export const incrementDetectionCount = async (userId) => {
  const result = await pool.query(
    'UPDATE users SET detection_count = detection_count + 1 WHERE id = $1 RETURNING id',
    [userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return getUserById(userId);
};

export const getProfileImage = async (userId) => {
  const result = await pool.query(
    'SELECT profile_image, profile_image_content_type FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );

  return result.rows[0] || null;
};

export const updateProfileImage = async (userId, profileImage) => {
  const result = await pool.query(
    `
      UPDATE users
      SET profile_image = $2, profile_image_content_type = $3
      WHERE id = $1
      RETURNING id
    `,
    [userId, profileImage?.image || null, profileImage?.contentType || null]
  );

  return result.rows[0] ? getUserById(result.rows[0].id) : null;
};

export const closeDatabase = async () => {
  await pool.end();
};
