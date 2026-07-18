-- Remove password uniqueness tracking. Different users may choose the same
-- password; only the email and vendor GST number must remain unique.
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordFingerprint";
