CREATE TABLE aluerajaus_luontoselvitystilaus
(
    id               INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    tilauksen_nimi   TEXT                    NOT NULL,
    tilauksen_tekija TEXT                    NOT NULL,
    tilausyksikko    TEXT                    NOT NULL,
    selvitys_id      UUID                    NULL,
    selvitys_linkki  TEXT                    NOT NULL,
    geom             geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX aluerajaus_luontoselvitystilaus_idx ON aluerajaus_luontoselvitystilaus USING gist (geom);

CREATE TABLE aluerajaus_luontoselvitys
(
    id              INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    selvitys_nimi   TEXT                    NOT NULL,
    selvitys_vuosi  INT                     NOT NULL CHECK ( selvitys_vuosi > 1900 AND selvitys_vuosi < 2100 ),
    selvitys_tekija TEXT                    NOT NULL,
    tilausyksikko   TEXT                    NOT NULL,
    pinta_ala       REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    selvitys_id     UUID                    NULL,
    selvitys_linkki TEXT                    NOT NULL,
    geom            geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX aluerajaus_luontoselvitys_idx ON aluerajaus_luontoselvitystilaus USING gist (geom);
