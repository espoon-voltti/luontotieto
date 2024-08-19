CREATE TABLE lajiryhma_alueet
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm        DATE                    NOT NULL,
    havaitsija TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    lajiryhma  TEXT                    NOT NULL,
    aluekuvaus TEXT,
    lisatieto  TEXT,
    viite      TEXT                    NOT NULL,
    pinta_ala  REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    geom       geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX lajiryhma_alueet_idx ON lajiryhma_alueet USING gist (geom);

COMMENT ON COLUMN lajiryhma_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN lajiryhma_alueet.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN lajiryhma_alueet.lajiryhma IS 'Lajiryhmä, jolle alue on merkittävä. Esim. linnut.';
COMMENT ON COLUMN lajiryhma_alueet.aluekuvaus IS 'Alueen merkitys lajiryhmälle, esim. paikallisesti arvokas lintualue';
COMMENT ON COLUMN lajiryhma_alueet.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN lajiryhma_alueet.viite IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN lajiryhma_alueet.pinta_ala IS 'Alueen koko hehtaareina';


CREATE TABLE arvokkaat_luontokohteet_alueet
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm        DATE                    NOT NULL,
    havaitsija TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    nimi       TEXT                    NOT NULL,
    arvoluokka TEXT                    NOT NULL,
    aluekuvaus TEXT,
    lisatieto  TEXT,
    viite      TEXT                    NOT NULL,
    pinta_ala  REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    geom       geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX arvokkaat_luontokohteet_alueet_idx ON arvokkaat_luontokohteet_alueet USING gist (geom);

COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.nimi IS 'Kohteen nimi. Kenttään täytetään kohdetta kuvaava nimi, kuten uomanosuuden nimi tai kohteen tunnettu kutsumanimi. Esim. Nettaan purolaakso tai Sahajärven lehtokorpi.';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.arvoluokka IS 'Kohteen arvon sanallinen kuvaus. Esim. paikallisesti arvokas, maakunnallisesti arvokas, muu säilyttämisen arvoinen luontokohde';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.aluekuvaus IS 'Alueen merkitys lajiryhmälle, esim. paikallisesti arvokas lintualue';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.viite IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN arvokkaat_luontokohteet_alueet.pinta_ala IS 'Alueen koko hehtaareina';


CREATE TABLE arvokkaat_vesikohteet_alueet
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm        DATE                    NOT NULL,
    havaitsija TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    nimi       TEXT                    NOT NULL,
    arvoluokka TEXT                    NOT NULL,
    aluekuvaus TEXT,
    vesisto    TEXT,
    lisatieto  TEXT,
    viite      TEXT                    NOT NULL,
    pinta_ala  REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED,
    geom       geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX arvokkaat_vesikohteet_alueet_idx ON arvokkaat_vesikohteet_alueet USING gist (geom);

COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.nimi IS 'Kohteen nimi. Kenttään täytetään esimerkiksi uomanosuuden nimi, vesialueen nimi tai kohteen tunnettu kutsumanimi.';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.arvoluokka IS 'Kohteen arvon sanallinen kuvaus. Esim. paikallisesti arvokas, maakunnallisesti arvokas, luonnontilainen puro';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.aluekuvaus IS 'Alueen merkitys lajiryhmälle, esim. paikallisesti arvokas lintualue';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.vesisto IS 'TODO:';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.viite IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN arvokkaat_vesikohteet_alueet.pinta_ala IS 'Alueen koko hehtaareina';







