CREATE TYPE luontotyyppi_paaryhma AS ENUM (
    'Lehdot', 'Kangasmetsät', 'Metsien erikoistyypit',
    'Suot', 'Kalliometsät/kalliot', 'Itämeri', 'Rannikko',
    'Sisävedet ja rannat', 'Perinnebiotoopit', 'Uusympäristö', 'Muu'
    );

CREATE TYPE edustavuus_luokka AS ENUM (
    'Erinomainen (1)','Hyvä (2)','Kohtalainen (3)','Heikko (4)','Muu (5)')
;

CREATE TYPE luontotyyppi_lumo_luokka AS ENUM ('0','1', '2', '3', '4');


CREATE TABLE luontotyypit_alueet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    vuosi                 INTEGER                  NOT NULL,
    havaitsija            TEXT                     NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    nimi                  TEXT,
    luontotyyppi_paaryhma luontotyyppi_paaryhma    NOT NULL,
    luontotyyppi          TEXT                     NOT NULL,
    uhanalaisuusluokka    "IUCN_luokka"            NOT NULL,
    edustavuus            edustavuus_luokka        NOT NULL,
    kuvaus                TEXT                     NOT NULL,
    lisatieto             TEXT                     NOT NULL,
    ominaislajit          TEXT                     NOT NULL,
    uhanalaiset_lajit     TEXT,
    lahopuusto            TEXT,
    lumo_luokka           luontotyyppi_lumo_luokka NOT NULL,
    pinta_ala             REAL                     NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    viite                 TEXT                     NOT NULL,
    selvitys_id           UUID                     NOT NULL,
    geom                  geometry(POLYGON, 3879)  NOT NULL
);
CREATE INDEX luontotyypit_alueet_idx ON luontotyypit_alueet USING gist (geom);


CREATE TYPE yhteyden_laatu AS ENUM (
    'Yhteys on nykyisellään toimiva',
    'Kehitettävä tai heikko yhteys'
    );


CREATE TABLE ekoyhteydet_alueet
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                    NOT NULL,
    vuosi       INTEGER                 NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    laatu       yhteyden_laatu          NOT NULL,
    lisatieto   TEXT                    NOT NULL,
    pinta_ala   REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    viite       TEXT                    NOT NULL,
    selvitys_id UUID                    NOT NULL,
    geom        geometry(POLYGON, 3879) NOT NULL
);
CREATE INDEX ekoyhteydet_alueet_idx ON ekoyhteydet_alueet USING gist (geom);



CREATE TABLE ekoyhteydet_viivat
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                       NOT NULL,
    vuosi       INTEGER                    NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                       NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    laatu       yhteyden_laatu             NOT NULL,
    lisatieto   TEXT                       NOT NULL,
    pituus      REAL                       NOT NULL GENERATED ALWAYS AS ( st_length(geom)) STORED,
    viite       TEXT                       NOT NULL,
    selvitys_id UUID                       NOT NULL,
    geom        geometry(LINESTRING, 3879) NOT NULL
);
CREATE INDEX ekoyhteydet_viivat_idx ON ekoyhteydet_viivat USING gist (geom);



CREATE TABLE lahteet_pisteet
(
    id          INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm         DATE                  NOT NULL,
    vuosi       INTEGER               NOT NULL GENERATED ALWAYS AS ( date_part('year', pvm) ) STORED,
    havaitsija  TEXT                  NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    tyyppi      TEXT                  NOT NULL,
    lisatieto   TEXT                  NOT NULL,
    viite       TEXT                  NOT NULL,
    selvitys_id UUID                  NOT NULL,
    geom        geometry(POINT, 3879) NOT NULL
);

CREATE INDEX lahteet_pisteet_idx ON lahteet_pisteet USING gist (geom);



