-- Staging/UAT tester role (see docs/STAGING_ENVIRONMENT.md)
DO $$ BEGIN
  ALTER TYPE "PlatformRole" ADD VALUE 'TESTER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
