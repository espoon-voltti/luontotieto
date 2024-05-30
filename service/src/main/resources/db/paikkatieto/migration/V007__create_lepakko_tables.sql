CREATE TABLE lepakko_viivat
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                       NOT NULL DEFAULT now(),
    vuosi       INTEGER                    NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                       NOT NULL DEFAULT '-' CHECK ( havaitsija <> ''),
    kuvaus      TEXT                       NOT NULL,
    pituus      REAL                       NOT NULL GENERATED ALWAYS AS ( st_length(geom) ) STORED,
    lisatieto   TEXT,
    viite       TEXT                       NOT NULL,
    selvitys_id UUID                       NOT NULL,
    geom        geometry(LINESTRING, 3879) NOT NULL
);

CREATE INDEX lepakko_viivat_idx ON lepakko_viivat USING gist (geom);

CREATE TYPE lepakko_luokka AS ENUM ('Luokka I', 'Luokka II', 'Luokka III');

CREATE TABLE lepakko_alueet
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                    NOT NULL DEFAULT now(),
    vuosi       INTEGER                 NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> ''),
    luokka      lepakko_luokka          NOT NULL,
    pinta_ala   REAL                    NOT NULL GENERATED ALWAYS AS ( st_area(geom) / 10000 ) STORED,
    lisatieto   TEXT,
    viite       TEXT                    NOT NULL,
    selvitys_id UUID                    NOT NULL,
    geom        geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX lepakko_alueet_idx ON lepakko_alueet USING gist (geom);
