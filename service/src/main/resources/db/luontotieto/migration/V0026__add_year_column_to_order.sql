ALTER table "order" ADD COLUMN year integer NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE)::integer;

UPDATE "order" SET year = EXTRACT(YEAR FROM created)::integer;
