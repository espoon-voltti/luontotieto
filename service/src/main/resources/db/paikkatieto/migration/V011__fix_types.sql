ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN elioryhma SET DATA TYPE text;

ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE text;

UPDATE muut_huomioitavat_lajit_pisteet
SET elioryhma     = "IUCN_luokka",
    "IUCN_luokka" = elioryhma;

ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN elioryhma SET DATA TYPE text;

ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE text;

UPDATE muut_huomioitavat_lajit_viivat
SET elioryhma     = "IUCN_luokka",
    "IUCN_luokka" = elioryhma;


ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN elioryhma SET DATA TYPE text;

ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE text;

UPDATE muut_huomioitavat_lajit_alueet
SET elioryhma     = "IUCN_luokka",
    "IUCN_luokka" = elioryhma;


ALTER TYPE muut_huomioitavat_lajit_elioryhma RENAME TO muut_huomioitavat_lajit_elioryhma_temp;
ALTER TYPE "muut_huomioitavat_lajit_IUCN_luokka" RENAME TO muut_huomioitavat_lajit_elioryhma;
ALTER TYPE muut_huomioitavat_lajit_elioryhma_temp RENAME TO "IUCN_luokka";

ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
        USING elioryhma::muut_huomioitavat_lajit_elioryhma;

ALTER TABLE muut_huomioitavat_lajit_pisteet
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka"
        USING "IUCN_luokka"::"IUCN_luokka";

ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
        USING elioryhma::muut_huomioitavat_lajit_elioryhma;

ALTER TABLE muut_huomioitavat_lajit_viivat
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka"
        USING "IUCN_luokka"::"IUCN_luokka";

ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN elioryhma SET DATA TYPE muut_huomioitavat_lajit_elioryhma
        USING elioryhma::muut_huomioitavat_lajit_elioryhma;

ALTER TABLE muut_huomioitavat_lajit_alueet
    ALTER COLUMN "IUCN_luokka" SET DATA TYPE "IUCN_luokka"
        USING "IUCN_luokka"::"IUCN_luokka";