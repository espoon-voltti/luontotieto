CREATE TABLE vieraslajit_alueet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                     NOT NULL,
    tieteellinen_nimi     TEXT                     NOT NULL,
    suomenkielinen_nimi   TEXT                     NOT NULL,
    yksilo_maara          INTEGER                  ,
    yksikko               TEXT                     ,
    lisatieto             TEXT                     ,
    pinta_ala             REAL                     NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    viite                 TEXT                     NOT NULL,
    havaitsija            TEXT                     NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                     ,
    geom                  geometry(POLYGON, 3879)  NOT NULL
);

CREATE INDEX vieraslajit_alueet_idx ON vieraslajit_alueet USING gist (geom);

COMMENT ON COLUMN vieraslajit_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN vieraslajit_alueet.pvm IS 'Päivämäärä, jolloin havainto on tehty tai arvio siitä.';
COMMENT ON COLUMN vieraslajit_alueet.tieteellinen_nimi IS 'Lajin tieteellinen nimi.';
COMMENT ON COLUMN vieraslajit_alueet.suomenkielinen_nimi IS 'Lajin suomenkielinen (yleiskielinen) nimi, jos sellainen on.';
COMMENT ON COLUMN vieraslajit_alueet.yksilo_maara IS 'Havaittujen yksilöiden määrä. Jos yksilömäärä ei ole tarkasti tiedossa, merkitään yksilömääräksi 0. Lisätietoja voi merkitä Lisätieto-kenttään.';
COMMENT ON COLUMN vieraslajit_alueet.yksikko IS 'Havaittujen yksiköiden tyyppi, esim. yksilö, itiöemä, pariskunta, protoneema.';
COMMENT ON COLUMN vieraslajit_alueet.lisatieto IS 'Mahdollisia lisätietoja havainnoista tai lyhyt kuvaus havainnosta. Kuvaus kasvupaikasta ja vieraslajiesiintymän tilanteesta.';
COMMENT ON COLUMN vieraslajit_alueet.pinta_ala IS 'Alueen koko hehtaareina.';
COMMENT ON COLUMN vieraslajit_alueet.viite IS 'Viite; viittaus selvitykseen tai vastaavaan, jonka yhteydessä havainto on tehty. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN vieraslajit_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';


CREATE TABLE vieraslajit_pisteet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                     NOT NULL,
    tieteellinen_nimi     TEXT                     NOT NULL,
    suomenkielinen_nimi   TEXT                     NOT NULL,
    yksilo_maara          INTEGER                  ,
    yksikko               TEXT                     ,
    lisatieto             TEXT                     ,
    viite                 TEXT                     NOT NULL,
    havaitsija            TEXT                     NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                     ,
    geom                  geometry(POINT, 3879)    NOT NULL
);

CREATE INDEX vieraslajit_pisteet_idx ON vieraslajit_pisteet USING gist (geom);

COMMENT ON COLUMN vieraslajit_pisteet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN vieraslajit_pisteet.pvm IS 'Päivämäärä, jolloin havainto on tehty tai arvio siitä.';
COMMENT ON COLUMN vieraslajit_pisteet.tieteellinen_nimi IS 'Lajin tieteellinen nimi.';
COMMENT ON COLUMN vieraslajit_pisteet.suomenkielinen_nimi IS 'Lajin suomenkielinen (yleiskielinen) nimi, jos sellainen on.';
COMMENT ON COLUMN vieraslajit_pisteet.yksilo_maara IS 'Havaittujen yksilöiden määrä. Jos yksilömäärä ei ole tarkasti tiedossa, merkitään yksilömääräksi 0. Lisätietoja voi merkitä Lisätieto-kenttään.';
COMMENT ON COLUMN vieraslajit_pisteet.yksikko IS 'Havaittujen yksiköiden tyyppi, esim. yksilö, itiöemä, pariskunta, protoneema.';
COMMENT ON COLUMN vieraslajit_pisteet.lisatieto IS 'Mahdollisia lisätietoja havainnoista tai lyhyt kuvaus havainnosta. Kuvaus kasvupaikasta ja vieraslajiesiintymän tilanteesta.';
COMMENT ON COLUMN vieraslajit_pisteet.viite IS 'Viite; viittaus selvitykseen tai vastaavaan, jonka yhteydessä havainto on tehty. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN vieraslajit_pisteet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
