CREATE TYPE liito_orava_yhteyden_luokka AS ENUM (
    'Olemassa oleva',
    'Kehitettävä',
    'Korvaamaton'
);

ALTER TABLE liito_orava_yhteysviivat
    ADD COLUMN luokka liito_orava_yhteyden_luokka;

ALTER TABLE liito_orava_yhteysviivat
    ALTER COLUMN laatu SET DATA TYPE text;

UPDATE liito_orava_yhteysviivat
SET
    luokka = CASE laatu
        WHEN 'Hyvä'                 THEN 'Olemassa oleva'::liito_orava_yhteyden_luokka
        WHEN 'Heikko/Parannettava'  THEN 'Kehitettävä'::liito_orava_yhteyden_luokka
        WHEN 'Yhteystarve'          THEN 'Kehitettävä'::liito_orava_yhteyden_luokka
    END,
    laatu = CASE laatu
        WHEN 'Hyvä'                 THEN 'Hyvä'
        WHEN 'Heikko/Parannettava'  THEN 'Heikko'
        WHEN 'Yhteystarve'          THEN 'Poikki'
    END;

DROP TYPE laatu;

CREATE TYPE liito_orava_yhteyden_laatu AS ENUM (
    'Hyvä',
    'Heikko',
    'Poikki'
);

ALTER TABLE liito_orava_yhteysviivat
    ALTER COLUMN laatu SET DATA TYPE liito_orava_yhteyden_laatu
    USING laatu::liito_orava_yhteyden_laatu;

COMMENT ON COLUMN liito_orava_yhteysviivat.laatu IS
    'Kulkuyhteydet luokitellaan niiden laadun perusteella luokkiin hyvä, heikko ja poikki.';

COMMENT ON COLUMN liito_orava_yhteysviivat.luokka IS
    'Yhteydet luokitellaan luokkiin olemassa oleva, kehitettävä ja korvaamaton, perustuen niiden laatuun sekä kulkuyhteyden merkitykseen suotuisan suojelutason saavuttamisessa.';
