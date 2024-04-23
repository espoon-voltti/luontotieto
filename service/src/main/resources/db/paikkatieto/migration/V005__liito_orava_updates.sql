ALTER TABLE liito_orava_alueet
    DROP COLUMN koko;
ALTER TABLE liito_orava_alueet
    ADD COLUMN koko REAL NOT NULL
        GENERATED ALWAYS AS (st_area(geom) / 10000) STORED;


ALTER TABLE liito_orava_yhteysviivat
    DROP COLUMN pituus;
ALTER TABLE liito_orava_yhteysviivat
    ADD COLUMN pituus REAL NOT NULL
        GENERATED ALWAYS AS (st_length(geom)) STORED;
