ALTER TABLE "order"
    ADD COLUMN assignee_contact_person TEXT;
UPDATE "order"
SET assignee_contact_person = '-'
WHERE "order".assignee_contact_person IS NULL;
ALTER TABLE "order"
    ALTER COLUMN assignee_contact_person SET NOT NULL;

ALTER TABLE "order"
    ADD COLUMN assignee_contact_email TEXT;
UPDATE "order"
SET assignee_contact_email = '-'
WHERE "order".assignee_contact_email IS NULL;
ALTER TABLE "order"
    ALTER COLUMN assignee_contact_email SET NOT NULL;

ALTER TABLE "order"
    ADD COLUMN return_date DATE;
UPDATE "order"
SET return_date = now()
WHERE "order".return_date IS NULL;
ALTER TABLE "order"
    ALTER COLUMN return_date SET NOT NULL;

ALTER TABLE "order"
    ADD COLUMN contact_person TEXT;
UPDATE "order"
SET contact_person = '-'
WHERE "order".contact_person IS NULL;
ALTER TABLE "order"
    ALTER COLUMN contact_person SET NOT NULL;

ALTER TABLE "order"
    ADD COLUMN contact_phone TEXT;
UPDATE "order"
SET contact_phone = '-'
WHERE "order".contact_phone IS NULL;
ALTER TABLE "order"
    ALTER COLUMN contact_phone SET NOT NULL;

ALTER TABLE "order"
    ADD COLUMN contact_email TEXT;
UPDATE "order"
SET contact_email = '-'
WHERE "order".contact_email IS NULL;
ALTER TABLE "order"
    ALTER COLUMN "contact_email" SET NOT NULL;
