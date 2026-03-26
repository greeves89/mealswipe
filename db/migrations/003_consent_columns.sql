-- Add GDPR consent audit trail columns (Art. 7)
ALTER TABLE users ADD COLUMN IF NOT EXISTS consented_at    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version TEXT;
