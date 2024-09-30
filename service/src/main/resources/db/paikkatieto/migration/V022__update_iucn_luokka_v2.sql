

-- Create specific types for muut huomioitavat lajit tables
CREATE TYPE "IUCN_luokka_lajit" AS ENUM (
     'Suomesta hävinneet (RE)',
     'Äärimmäisen uhanalaiset (CR)',
     'Erittäin uhanalaiset (EN)',
     'Vaarantuneet (VU)',
     'Silmälläpidettävät (NT)',
     'Elinvoimaiset (LC)',
     'Puutteellisesti tunnetut (DD)',
     'Arvioimatta jätetyt (NA)'
     );

-- Create specific types for luontotyypit tables
CREATE TYPE "IUCN_luokka_luontotyypit" AS ENUM (
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

-- Update values
UPDATE muut_huomioitavat_lajit_pisteet SET "IUCN_luokka" = 'Suomesta hävinneet (RE)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (CO)';
UPDATE muut_huomioitavat_lajit_viivat SET "IUCN_luokka" = 'Suomesta hävinneet (RE)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (CO)';
UPDATE muut_huomioitavat_lajit_alueet SET "IUCN_luokka" = 'Suomesta hävinneet (RE)' WHERE "IUCN_luokka" = 'Suomesta hävinneet (CO)';
UPDATE muut_huomioitavat_lajit_pisteet SET "IUCN_luokka" = 'Elinvoimaiset (LC)' WHERE "IUCN_luokka" = 'Säilyvät (LC)';
UPDATE muut_huomioitavat_lajit_viivat SET "IUCN_luokka" = 'Elinvoimaiset (LC)' WHERE "IUCN_luokka" = 'Säilyvät (LC)';
UPDATE muut_huomioitavat_lajit_alueet SET "IUCN_luokka" = 'Elinvoimaiset (LC)' WHERE "IUCN_luokka" = 'Säilyvät (LC)';

-- Alter the IUCN_luokka to new laji specific type
ALTER TABLE muut_huomioitavat_lajit_pisteet ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_lajit" USING "IUCN_luokka"::"IUCN_luokka_lajit";
ALTER TABLE muut_huomioitavat_lajit_viivat ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_lajit" USING "IUCN_luokka"::"IUCN_luokka_lajit";
ALTER TABLE muut_huomioitavat_lajit_alueet ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka_lajit" USING "IUCN_luokka"::"IUCN_luokka_lajit";

-- Alter the IUCN_luokka to new luontotyyppi specific type
ALTER TABLE luontotyypit_alueet ALTER COLUMN uhanalaisuusluokka SET DATA TYPE TEXT USING uhanalaisuusluokka::TEXT;
ALTER TABLE luontotyypit_alueet ALTER COLUMN uhanalaisuusluokka SET DATA TYPE "IUCN_luokka_luontotyypit" USING uhanalaisuusluokka::"IUCN_luokka_luontotyypit";

DROP TYPE "IUCN_luokka";
