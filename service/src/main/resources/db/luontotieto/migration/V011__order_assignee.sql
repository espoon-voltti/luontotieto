ALTER TABLE "order"
    ADD COLUMN assignee_id uuid REFERENCES users (id);
UPDATE "order"
SET assignee_id = created_by;
ALTER TABLE "order"
    ALTER COLUMN assignee_id SET NOT NULL;
