CREATE TYPE lumo_luokka AS ENUM ('1', '2', '3', '4');
CREATE TABLE lumo_alueet
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                    NOT NULL,
    vuosi       INTEGER                 NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    nimi        TEXT,
    lumo_luokka lumo_luokka             NOT NULL,
    lisatieto   TEXT,
    pinta_ala   REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    viite       TEXT                    NOT NULL,
    selvitys_id UUID                    NOT NULL,
    geom        geometry(POLYGON, 3879) NOT NULL
);
CREATE INDEX lumo_alueet_alueet_idx ON lumo_alueet USING gist (geom);

CREATE TABLE noro_viivat
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                       NOT NULL,
    vuosi       INTEGER                    NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                       NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    tyyppi      TEXT                       NOT NULL DEFAULT 'Havumetsävyöhykkeen noro',
    lisatieto   TEXT,
    pituus      REAL                       NOT NULL GENERATED ALWAYS AS ( st_length(geom)) STORED,
    viite       TEXT                       NOT NULL,
    selvitys_id UUID                       NOT NULL,
    geom        geometry(LINESTRING, 3879) NOT NULL
);
CREATE INDEX noro_viivat_idx ON noro_viivat USING gist (geom);
