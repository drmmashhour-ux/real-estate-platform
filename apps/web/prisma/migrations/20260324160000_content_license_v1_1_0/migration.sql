-- Bump required Content & Usage License version after terms update (ecosystem / permitted & prohibited uses).
UPDATE "content_license_policy"
SET "current_version" = '1.1.0', "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'global';
