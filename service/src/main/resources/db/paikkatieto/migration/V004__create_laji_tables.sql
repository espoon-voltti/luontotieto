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
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.pvm IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.elioryhma IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.tieteellinen_nimi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.suomenkielinen_nimi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet."IUCN_luokka" IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.direktiivi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.paikan_nimi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.havaintopaikan_kuvaus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.koordinaatti_tarkkuus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.yksilo_maara IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.yksikko IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.lisatieto IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.viite IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.havaitsija IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_pisteet.selvitys_id IS 'TODO';

-- ************************
-- Muut huomioitavat lajit, viivat

CREATE TABLE muut_huomioitavat_lajit_viivat
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                       NOT NULL,                                           -- Oletus 1.1.yyyy
    laji                  TEXT                       NOT NULL,
    direktiivi            TEXT                       NOT NULL DEFAULT '-' CHECK ( direktiivi <> '' ),
    havaintopaikan_kuvaus TEXT,
    laji_luokitus         TEXT                       NOT NULL DEFAULT '-' CHECK ( laji_luokitus <> '' ), -- esim. lepakoille eurobat luokka
    lisatieto             TEXT,                                                                          -- Yhdistä havainnon_kuvaus ja lisätieto
    pituus                REAL                       NOT NULL GENERATED ALWAYS AS ( st_length(geom)) STORED,
    viite                 TEXT                       NOT NULL,                                           -- vanha nimi: Tietolähteen selite. Jatkossa luontotietosovellus kirjoittaa tämän arvon
    havaitsija            TEXT                       NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                       NULL,
    geom                  geometry(LINESTRING, 3879) NOT NULL
);


CREATE INDEX muut_huomioitavat_lajit_viivat_idx ON muut_huomioitavat_lajit_viivat USING gist (geom);

COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.pvm IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.laji IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.direktiivi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.havaintopaikan_kuvaus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.laji_luokitus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.lisatieto IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.pituus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.viite IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.havaitsija IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_viivat.selvitys_id IS 'TODO';

-- ************************
-- Muut huomioitavat lajit, aluetaulu

CREATE TABLE muut_huomioitavat_lajit_alueet
(
    id                    INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                   DATE                    NOT NULL,                                                    -- Oletus 1.1.yyyy
    laji                  TEXT                    NOT NULL,
    direktiivi            TEXT                    NOT NULL DEFAULT '-' CHECK ( direktiivi <> '' ),
    havaintopaikan_kuvaus TEXT,
    laji_luokitus         TEXT                    NOT NULL DEFAULT '-' CHECK ( laji_luokitus <> '' ),          -- esim. lepakoille eurobat luokka
    yksilo_maara          INTEGER,
    yksikko               TEXT,                                                                                -- Onko havaittu 15 protoneemaa, yksilöä, itiö jne.
    lisatieto             TEXT,                                                                                -- Yhdistä havainnon_kuvaus ja lisätieto
    pinta_ala             REAL                    NOT NULL GENERATED ALWAYS AS (st_area(geom) / 10000) STORED, -- Lasketaan automaattisesti: alueen pinta-ala (ha). Korjaa myös liito-oraville. Pinta-alat aina (ha)
    viite                 TEXT                    NOT NULL,                                                    -- vanha nimi: Tietolähteen selite. Jatkossa luontotietosovellus kirjoittaa tämän arvon
    havaitsija            TEXT                    NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    selvitys_id           UUID                    NULL,
    geom                  geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX muut_huomioitavat_lajit_alueet_idx ON muut_huomioitavat_lajit_alueet USING gist (geom);

COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.pvm IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.laji IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.direktiivi IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.havaintopaikan_kuvaus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.laji_luokitus IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.yksilo_maara IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.yksikko IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.lisatieto IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.pinta_ala IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.viite IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.havaitsija IS 'TODO';
COMMENT ON COLUMN muut_huomioitavat_lajit_alueet.selvitys_id IS 'TODO';
