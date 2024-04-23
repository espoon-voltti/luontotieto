
ALTER TABLE "order"
ALTER COLUMN plan_number type TEXT[] USING plan_number::text[];


