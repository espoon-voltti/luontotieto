


-- Flyway migrations should be run inside a transaction but lets be sure
BEGIN;

-- Create the new type
CREATE TYPE muut_huomioitavat_lajit_elioryhma_new AS ENUM (
'Hyönteiset ja hämähäkkieläimet',
'Kalat',
'Levät',
'Linnut',
'Madot',
'Matelijat ja sammakkoeläimet',
'Muut organismit',
'Nilviäiset',
'Nisäkkäät',
'Putkilokasvit',
'Sammalet',
'Sienet ja jäkälät',
'Tuhatjalkaiset',
'Äyriäiset');

-- Alter the column to text so we can migrate the existing values
ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN elioryhma SET DATA TYPE text;
ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN elioryhma SET DATA TYPE text;
ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN elioryhma SET DATA TYPE text;

UPDATE muut_huomioitavat_lajit_alueet
SET elioryhma = 'Hyönteiset ja hämähäkkieläimet'
WHERE elioryhma NOT IN (
'Hyönteiset ja hämähäkkieläimet',
'Kalat',
'Levät',
'Linnut',
'Madot',
'Matelijat ja sammakkoeläimet',
'Muut organismit',
'Nilviäiset',
'Nisäkkäät',
'Putkilokasvit',
'Sammalet',
'Sienet ja jäkälät',
'Tuhatjalkaiset',
'Äyriäiset');

UPDATE muut_huomioitavat_lajit_pisteet
SET elioryhma = 'Hyönteiset ja hämähäkkieläimet'
WHERE elioryhma NOT IN (
'Hyönteiset ja hämähäkkieläimet',
'Kalat',
'Levät',
'Linnut',
'Madot',
'Matelijat ja sammakkoeläimet',
'Muut organismit',
'Nilviäiset',
'Nisäkkäät',
'Putkilokasvit',
'Sammalet',
'Sienet ja jäkälät',
'Tuhatjalkaiset',
'Äyriäiset');

UPDATE muut_huomioitavat_lajit_viivat
SET elioryhma = 'Hyönteiset ja hämähäkkieläimet'
WHERE elioryhma NOT IN (
'Hyönteiset ja hämähäkkieläimet',
'Kalat',
'Levät',
'Linnut',
'Madot',
'Matelijat ja sammakkoeläimet',
'Muut organismit',
'Nilviäiset',
'Nisäkkäät',
'Putkilokasvit',
'Sammalet',
'Sienet ja jäkälät',
'Tuhatjalkaiset',
'Äyriäiset');

-- Drop the old enum type
DROP TYPE muut_huomioitavat_lajit_elioryhma;

-- Rename the new enum type to the original enum type name
ALTER TYPE muut_huomioitavat_lajit_elioryhma_new RENAME TO muut_huomioitavat_lajit_elioryhma;


-- Alter the columns to use the new type
ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
    USING elioryhma::muut_huomioitavat_lajit_elioryhma;

ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
    USING elioryhma::muut_huomioitavat_lajit_elioryhma;

ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
    USING elioryhma::muut_huomioitavat_lajit_elioryhma;

COMMIT;

