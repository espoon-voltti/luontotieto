CREATE TYPE "IUCN_luokka_new" AS ENUM (
    'Suomesta hävinneet (CO)',
    'Äärimmäisen uhanalaiset (CR)',
    'Erittäin uhanalaiset (EN)',
    'Vaarantuneet (VU)',
    'Silmälläpidettävät (NT)',
    'Säilyvät (LC)',
    'Puutteellisesti tunnetut (DD)',
    'Arvioimatta jätetyt (NE)'
    );

-- Alter the IUCN_luokka columns to text so we can migrate values
ALTER TABLE muut_huomioitavat_lajit_pisteet ALTER COLUMN "IUCN_luokka" SET DATA TYPE TEXT USING "IUCN_luokka"::TEXT;
ALTER TABLE muut_huomioitavat_lajit_viivat ALTER COLUMN "IUCN_luokka" SET DATA TYPE TEXT USING "IUCN_luokka"::TEXT;
ALTER TABLE muut_huomioitavat_lajit_alueet ALTER COLUMN "IUCN_luokka" SET DATA TYPE TEXT USING "IUCN_luokka"::TEXT;
ALTER TABLE luontotyypit_alueet ALTER COLUMN uhanalaisuusluokka SET DATA TYPE TEXT USING uhanalaisuusluokka::TEXT;

-- Update values
UPDATE muut_huomioitavat_lajit_pisteet SET "IUCN_luokka" = 'Suomesta hävinneet (CO)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (RE)';
UPDATE muut_huomioitavat_lajit_viivat SET "IUCN_luokka" = 'Suomesta hävinneet (CO)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (RE)';
UPDATE muut_huomioitavat_lajit_alueet SET "IUCN_luokka" = 'Suomesta hävinneet (CO)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (RE)';
UPDATE luontotyypit_alueet SET uhanalaisuusluokka = 'Suomesta hävinneet (CO)' WHERE uhanalaisuusluokka = 'Suomesta hävinneet (RE)';

UPDATE muut_huomioitavat_lajit_pisteet SET "IUCN_luokka" = 'Säilyvät (LC)' WHERE "IUCN_luokka" = 'Elinvoimaiset (LC)';
UPDATE muut_huomioitavat_lajit_viivat SET "IUCN_luokka" = 'Säilyvät (LC)' WHERE "IUCN_luokka" = 'Elinvoimaiset (LC)';
UPDATE muut_huomioitavat_lajit_alueet SET "IUCN_luokka" = 'Säilyvät (LC)' WHERE "IUCN_luokka" = 'Elinvoimaiset (LC)';
UPDATE luontotyypit_alueet SET uhanalaisuusluokka = 'Säilyvät (LC)' WHERE uhanalaisuusluokka = 'Elinvoimaiset (LC)';


-- Alter the IUCN_luokka to the new type
ALTER TABLE muut_huomioitavat_lajit_pisteet ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_new" USING "IUCN_luokka"::"IUCN_luokka_new";
ALTER TABLE muut_huomioitavat_lajit_viivat ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_new" USING "IUCN_luokka"::"IUCN_luokka_new";
ALTER TABLE muut_huomioitavat_lajit_alueet ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_new" USING "IUCN_luokka"::"IUCN_luokka_new";
ALTER TABLE luontotyypit_alueet ALTER COLUMN uhanalaisuusluokka SET DATA TYPE "IUCN_luokka_new" USING uhanalaisuusluokka::"IUCN_luokka_new";

DROP TYPE "IUCN_luokka";

ALTER TYPE "IUCN_luokka_new" RENAME TO "IUCN_luokka";