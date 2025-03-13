ALTER table "order" ADD COLUMN year integer;
UPDATE "order" SET year = EXTRACT(YEAR FROM return_date)::integer;
ALTER table "order" ALTER COLUMN year SET NOT NULL;
