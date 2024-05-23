-- Muut huomioitavat lajit paitsi liito-orava
-- Muut huomioitavat lajit, pistetaulu

CREATE TYPE muut_huomioitavat_lajit_elioryhma AS ENUM (
    'Suomesta hävinneet (RE)',
    'Äärimmäisen uhanalaiset (CR)',
    'Erittäin uhanalaiset (EN)',
    'Vaarantuneet (VU)',
    'Silmälläpidettävät (NT)',
    'Elinvoimaiset (LC)',
    'Puutteellisesti tunnetut (DD)');

CREATE TYPE "muut_huomioitavat_lajit_IUCN_luokka" AS ENUM (
    'Harvajalkaiset (PA)',
    'Hämähäkkieläimet (AR)',
    'Juoksujalkaiset (CP)',
    'Jäkälät (LI)',
    'Jäytiäiset (PS)',
    'Kaislakorennot (ML)',
    'Kaksisiipiset (DI)',
    'Kaksoisjalkaiset (DP)',
    'Kalat (PI)',
    'Kierresiipiset (SR)',
    'Kirput (SP)',
    'Kolmisukahäntäiset (TY)',
    'Koskikorennot (PP)',
    'Kovakuoriaiset (CO)',
    'Kärsäkorennot (MP)',
    'Käärmekorennot (RP)',
    'Linnut (AV)',
    'Luteet (HE)',
    'Matelijat (RE)',
    'Nilviäiset (MO)',
    'Nisäkkäät (MA)',
    'Nivelmadot (AN)',
    'Perhoset (LE)',
    'Pihtihäntäiset (DE)',
    'Pistiäiset (HY)',
    'Päivänkorennot (EP)',
    'Ripsiäiset (TH)',
    'Sammakkoeläimet (AM)',
    'Sokkojuoksiaiset (SY)',
    'Sudenkorennot (OD)',
    'Suorasiipiset (OR)',
    'Torakat (BL)',
    'Verkkosiipiset (NP)',
    'Vesiperhoset (TP)',
    'Yhtäläissiipiset (HO)',
    'Äyriäiset (CR)');

CREATE TABLE muut_huomioitavat_lajit_pisteet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                                  NOT NULL, -- Oletus 1.1.yyyy
    elioryhma             muut_huomioitavat_lajit_elioryhma     NOT NULL,
    tieteellinen_nimi     TEXT                                  NOT NULL,
    suomenkielinen_nimi   TEXT                                  NOT NULL,
    "IUCN_luokka"         "muut_huomioitavat_lajit_IUCN_luokka" NOT NULL,
    direktiivi            TEXT                                  NOT NULL DEFAULT '-' CHECK ( direktiivi <> '' ),
    paikan_nimi           TEXT,
    havaintopaikan_kuvaus TEXT,
    koordinaatti_tarkkuus REAL                                           DEFAULT 0,
    tarkkuus              luontotieto_mittaustyyppi             NOT NULL,
    yksilo_maara          INTEGER                               NOT NULL DEFAULT 0,
    yksikko               TEXT,                                           -- Onko havaittu 15 protoneemaa, yksilöä, itiö jne.
    lisatieto             TEXT,                                           -- Yhdistä havainnon_kuvaus ja lisätieto
    viite                 TEXT                                  NOT NULL, -- vanha nimi: Tietolähteen selite. Jatkossa luontotietosovellus kirjoittaa tämän arvon
    havaitsija            TEXT                                  NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                                  NULL,
    geom                  geometry(POINT, 3879)                 NOT NULL
);

CREATE INDEX muut_huomioitavat_lajit_pisteet_idx ON muut_huomioitavat_lajit_pisteet USING gist (geom);

COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.pvm IS 'Päivämäärä, jolloin havainto on tehty tai arvio siitä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.elioryhma IS 'Eliöryhmä, johon laji kuuluu. Valitaan listasta sopiva.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.tieteellinen_nimi IS 'Lajin tieteellinen nimi';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.suomenkielinen_nimi IS 'Lajin suomenkielinen (yleiskielinen) nimi, jos sellainen on';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet."IUCN_luokka" IS 'Uhanalaisluokituksessa käytetään viimeisintä Suomen uhanalaisuusarviointia (Punainen kirja), joka noudattaa kansainvälisen luonnonsuojeluliiton IUCN:n ohjeita. Uhanalaisuustarkastelussa käytettävät IUCN-luokat, valitaan listasta sopiva: Suomesta hävinneet (RE), Äärimmäisen uhanalaiset (CR), Erittäin uhanalaiset (EN), Vaarantuneet (VU), Silmälläpidettävät (NT), Elinvoimaiset (LC), Puutteellisesti tunnetut (DD)';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.direktiivi IS 'Jos kyseinen laji on luontodirektiivin liitteen tai lintudirektiivin liitteen laji se saa sen direktiivin numeron (I, II, III, IV, V), mihin se kuuluu. Sama laji voi kuulua useampaan liitteeseen. Jos laji ei kuulu direktiivilajeihin, sen merkintä on aina "-".';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.paikan_nimi IS 'Paikan nimi, kun havainto ei ole tarkka';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.havaintopaikan_kuvaus IS 'Lyhyt, vapaamuotoinen kuvaus havaintopaikasta.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.koordinaatti_tarkkuus IS 'Koordinaattien arvioitu heitto metreissä';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu" tai "tarkkuusmitattu". "Tarkkuusmitattu" tarkoittaa sitä, että sijainti on varmistettu tarkkuusmittaamalla esim. takymetrillä. "Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. ilmakuvan perusteella merkittyä sijaintia.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.yksilo_maara IS 'Havaittujen yksilöiden määrä. Jos yksilömäärä ei ole tarkasti tiedossa, merkitään yksilömääräksi 0. Lisätietoja voi merkitä Lisätieto-kenttään.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.yksikko IS 'Havaittujen yksiköiden tyyppi, esim. yksilö, itiöemä, pariskunta, protoneema.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.lisatieto IS 'Mahdollisia lisätietoja havainnoista tai lyhyt kuvaus havainnosta. Mahdollisia tarkempia mainintoja esiintymän laadusta tai muu arvoperuste (hot spot, lisääntymiskolonia, ruokailualue tms.)';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.viite IS 'Viite; viittaus selvitykseen tai vastaavaan, jonka yhteydessä havainto on tehty. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.selvitys_id IS 'Selvityksen tunniste';

-- ************************
-- Muut huomioitavat lajit, viivat

CREATE TABLE muut_huomioitavat_lajit_viivat
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                                  NOT NULL,
    elioryhma             muut_huomioitavat_lajit_elioryhma     NOT NULL,
    tieteellinen_nimi     TEXT                                  NOT NULL,
    suomenkielinen_nimi   TEXT                                  NOT NULL,
    "IUCN_luokka"         "muut_huomioitavat_lajit_IUCN_luokka" NOT NULL,                                           -- Oletus 1.1.yyyy
    direktiivi            TEXT                                  NOT NULL DEFAULT '-' CHECK ( direktiivi <> '' ),
    havaintopaikan_kuvaus TEXT,
    laji_luokitus         TEXT                                  NOT NULL DEFAULT '-' CHECK ( laji_luokitus <> '' ), -- esim. lepakoille eurobat luokka
    lisatieto             TEXT,                                                                                     -- Yhdistä havainnon_kuvaus ja lisätieto
    pituus                REAL                                  NOT NULL GENERATED ALWAYS AS ( st_length(geom)) STORED,
    viite                 TEXT                                  NOT NULL,                                           -- vanha nimi: Tietolähteen selite. Jatkossa luontotietosovellus kirjoittaa tämän arvon
    havaitsija            TEXT                                  NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                                  NULL,
    geom                  geometry(LINESTRING, 3879)            NOT NULL
);


CREATE INDEX muut_huomioitavat_lajit_viivat_idx ON muut_huomioitavat_lajit_viivat USING gist (geom);

COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.pvm IS 'Päivämäärä, jolloin havainto on tehty tai arvio siitä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.elioryhma IS 'Eliöryhmä, johon laji kuuluu. Valitaan listasta sopiva.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.tieteellinen_nimi IS 'Lajin tieteellinen nimi';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.suomenkielinen_nimi IS 'Lajin suomenkielinen (yleiskielinen) nimi, jos sellainen on';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat."IUCN_luokka" IS 'Uhanalaisluokituksessa käytetään viimeisintä Suomen uhanalaisuusarviointia (Punainen kirja), joka noudattaa kansainvälisen luonnonsuojeluliiton IUCN:n ohjeita. Uhanalaisuustarkastelussa käytettävät IUCN-luokat, valitaan listasta sopiva: Suomesta hävinneet (RE), Äärimmäisen uhanalaiset (CR), Erittäin uhanalaiset (EN), Vaarantuneet (VU), Silmälläpidettävät (NT), Elinvoimaiset (LC), Puutteellisesti tunnetut (DD)';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.direktiivi IS 'Jos kyseinen laji on luontodirektiivin liitteen tai lintudirektiivin liitteen laji se saa sen direktiivin numeron (I, II, III, IV, V), mihin se kuuluu. Sama laji voi kuulua useampaan liitteeseen. Jos laji ei kuulu direktiivilajeihin, sen merkintä on aina "-".';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.havaintopaikan_kuvaus IS 'Lyhyt, vapaamuotoinen kuvaus havaintopaikasta.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.laji_luokitus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.lisatieto IS 'Mahdollisia lisätietoja havainnoista tai lyhyt kuvaus havainnosta. Mahdollisia tarkempia mainintoja esiintymän laadusta tai muu arvoperuste (hot spot, lisääntymiskolonia, ruokailualue tms.)';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.pituus IS 'Kulkuyhteyden/liikkumisyhteyden pituus metreinä';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.viite IS 'Viite; viittaus selvitykseen tai vastaavaan, jonka yhteydessä havainto on tehty. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.selvitys_id IS 'Selvityksen tunniste';

-- ************************
-- Muut huomioitavat lajit, aluetaulu

CREATE TABLE muut_huomioitavat_lajit_alueet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                                  NOT NULL,                                                    -- Oletus 1.1.yyyy
    elioryhma             muut_huomioitavat_lajit_elioryhma     NOT NULL,
    tieteellinen_nimi     TEXT                                  NOT NULL,
    suomenkielinen_nimi   TEXT                                  NOT NULL,
    "IUCN_luokka"         "muut_huomioitavat_lajit_IUCN_luokka" NOT NULL,
    direktiivi            TEXT                                  NOT NULL DEFAULT '-' CHECK ( direktiivi <> '' ),
    havaintopaikan_kuvaus TEXT,
    laji_luokitus         TEXT                                  NOT NULL DEFAULT '-' CHECK ( laji_luokitus <> '' ),          -- esim. lepakoille eurobat luokka
    yksilo_maara          INTEGER,
    yksikko               TEXT,                                                                                              -- Onko havaittu 15 protoneemaa, yksilöä, itiö jne.
    lisatieto             TEXT,                                                                                              -- Yhdistä havainnon_kuvaus ja lisätieto
    pinta_ala             REAL                                  NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED, -- Lasketaan automaattisesti: alueen pinta-ala (ha). Korjaa myös liito-oraville. Pinta-alat aina (ha)
    viite                 TEXT                                  NOT NULL,                                                    -- vanha nimi: Tietolähteen selite. Jatkossa luontotietosovellus kirjoittaa tämän arvon
    havaitsija            TEXT                                  NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                                  NULL,
    geom                  geometry(POLYGON, 3879)               NOT NULL
);

CREATE INDEX muut_huomioitavat_lajit_alueet_idx ON muut_huomioitavat_lajit_alueet USING gist (geom);

COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.pvm IS 'Päivämäärä, jolloin havainto on tehty tai arvio siitä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.elioryhma IS 'Eliöryhmä, johon laji kuuluu. Valitaan listasta sopiva.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.tieteellinen_nimi IS 'Lajin tieteellinen nimi';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.suomenkielinen_nimi IS 'Lajin suomenkielinen (yleiskielinen) nimi, jos sellainen on';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet."IUCN_luokka" IS 'Uhanalaisluokituksessa käytetään viimeisintä Suomen uhanalaisuusarviointia (Punainen kirja), joka noudattaa kansainvälisen luonnonsuojeluliiton IUCN:n ohjeita. Uhanalaisuustarkastelussa käytettävät IUCN-luokat, valitaan listasta sopiva: Suomesta hävinneet (RE), Äärimmäisen uhanalaiset (CR), Erittäin uhanalaiset (EN), Vaarantuneet (VU), Silmälläpidettävät (NT), Elinvoimaiset (LC), Puutteellisesti tunnetut (DD)';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.direktiivi IS 'Jos kyseinen laji on luontodirektiivin liitteen tai lintudirektiivin liitteen laji se saa sen direktiivin numeron (I, II, III, IV, V), mihin se kuuluu. Sama laji voi kuulua useampaan liitteeseen. Jos laji ei kuulu direktiivilajeihin, sen merkintä on aina "-".';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.havaintopaikan_kuvaus IS 'Lyhyt, vapaamuotoinen kuvaus havaintopaikasta.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.laji_luokitus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.yksilo_maara IS 'Havaittujen yksilöiden määrä. Jos yksilömäärä ei ole tarkasti tiedossa, merkitään yksilömääräksi 0. Lisätietoja voi merkitä Lisätieto-kenttään.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.yksikko IS 'Havaittujen yksiköiden tyyppi, esim. yksilö, itiöemä, pariskunta, protoneema.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.lisatieto IS 'Mahdollisia lisätietoja havainnoista tai lyhyt kuvaus havainnosta. Mahdollisia tarkempia mainintoja esiintymän laadusta tai muu arvoperuste (hot spot, lisääntymiskolonia, ruokailualue tms.)';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.pinta_ala IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.viite IS 'Viite; viittaus selvitykseen tai vastaavaan, jonka yhteydessä havainto on tehty. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.selvitys_id IS 'Selvityksen tunniste';


