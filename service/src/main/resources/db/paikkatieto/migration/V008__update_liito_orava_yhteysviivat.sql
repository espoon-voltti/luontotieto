ALTER TABLE liito_orava_pisteet
    ADD COLUMN vuosi INTEGER GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED;
ALTER TABLE liito_orava_alueet
    ADD COLUMN vuosi INTEGER GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED;
ALTER TABLE muut_huomioitavat_lajit_alueet
    ADD COLUMN vuosi INTEGER GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED;
ALTER TABLE muut_huomioitavat_lajit_viivat
    ADD COLUMN vuosi INTEGER GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED;
ALTER TABLE muut_huomioitavat_lajit_pisteet
    ADD COLUMN vuosi INTEGER GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED;

ALTER TABLE liito_orava_yhteysviivat
    ADD COLUMN pvm DATE;
UPDATE liito_orava_yhteysviivat
SET pvm = make_date(vuosi, 1, 1)
WHERE pvm IS NULL;
ALTER TABLE liito_orava_yhteysviivat
    ALTER COLUMN pvm SET NOT NULL;

ALTER TABLE liito_orava_yhteysviivat
    DROP COLUMN vuosi;
ALTER TABLE liito_orava_yhteysviivat
    ADD COLUMN vuosi INTEGER NOT NULL GENERATED ALWAYS AS (date_part('year', pvm)) STORED;



