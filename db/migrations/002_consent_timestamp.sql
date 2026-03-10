-- Migration 002: Add consent timestamp to users
-- DSGVO Art. 7 — store when user accepted the privacy policy

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT DEFAULT '1.0';
