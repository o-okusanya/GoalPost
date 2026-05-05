-- ============================================================
--  GoalPost Database Schema
--  Run this once against your PostgreSQL database:
--    psql -U postgres -d goalpost -f schema.sql
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  first_name VARCHAR(100)        NOT NULL,
  last_name  VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,   -- bcrypt hash
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Folders
CREATE TABLE IF NOT EXISTS folders (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id           SERIAL PRIMARY KEY,
  user_id      INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id    INT          REFERENCES folders(id) ON DELETE SET NULL,
  name         VARCHAR(255) NOT NULL,
  genre        VARCHAR(100) NOT NULL,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('progress', 'checkbox')),
  progress     INT          NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  checked      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user    ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user  ON folders(user_id);
