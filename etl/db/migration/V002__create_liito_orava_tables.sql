-- Liito-orava papanapuutaulukko

CREATE TYPE liito_orava_pesatyyppi AS ENUM ('Risu', 'Pönttö', 'Kolo', 'Muu', '-');
CREATE TYPE luontotieto_mittaustyyppi AS ENUM ('GPS', 'Muu', 'Tarkkuusmitattu');

CREATE TABLE liito_orava_pisteet (
     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     pvm DATE NOT NULL,
     havaitsija TEXT NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
     puulaji TEXT NOT NULL DEFAULT '-' CHECK ( puulaji <> '' ),
     halkaisija INTEGER NOT NULL CHECK ( halkaisija >= 0 AND halkaisija < 200),
     papanamaara INTEGER NOT NULL CHECK ( papanamaara >= 0 ),
     pesa BOOLEAN NOT NULL,
     pesatyyppi liito_orava_pesatyyppi NOT NULL,
     pesankorkeus INTEGER NOT NULL CHECK ( pesankorkeus >= 0 ),
     lisatieto TEXT,
     viite TEXT NOT NULL,
     kunta INTEGER CHECK ( kunta > 0 AND kunta < 1000),
     tarkkuus luontotieto_mittaustyyppi NOT NULL,
     geom geometry(POINT, 3879) NOT NULL
);

CREATE INDEX liito_orava_pisteet_idx ON liito_orava_pisteet USING gist(geom);

COMMENT ON COLUMN liito_orava_pisteet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN liito_orava_pisteet.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN liito_orava_pisteet.puulaji IS 'Puulaji, kirjoitettava selkeästi auki, ei lyhenteitä. Jos on unohdettu laittaa puutyyppi, merkitään viiva "-"';
COMMENT ON COLUMN liito_orava_pisteet.halkaisija IS 'Puun halkaisija arvioituna senttimetreissä rinnankorkeudelta';
COMMENT ON COLUMN liito_orava_pisteet.papanamaara IS 'Papanoiden määrän arvio absoluuttisena määränä.';
COMMENT ON COLUMN liito_orava_pisteet.pesa IS 'Pesäpuu on puu, jossa kolo/risupesä/pönttö, jonka alla papanoita tai voidaan muilla perustein todeta pesäpuuksi (esimerkiksi näköhavainto, kun liito-orava käyttää pesää). Kartoittajan asiantuntemuksella tehty arvio. Jos kyseessä on kolo / pönttö / risupesä, jota ei voida maastokäynnin perusteella merkitä asutuksi tai käytetyksi pesäksi, sarakkeeseen merkitään "ei". Potentiaalinen pesä ei ole olemassa oleva pesä.';
COMMENT ON COLUMN liito_orava_pisteet.pesatyyppi IS 'Pesätyyppiin on 4 vaihtoehtoa, esim. risupesä on "risu". Jos pesätyyppi ei ole risupesä, kolopesä tai pönttö, se on muu. Jos näkyvää pesätyyppiä ei ole, kohtaan merkitään "-"';
COMMENT ON COLUMN liito_orava_pisteet.pesankorkeus IS 'Pesän arvioitu korkeus metreissä. Jos kyseessä kolopuu ilman todennettua pesää, niin kolon korkeus.';
COMMENT ON COLUMN liito_orava_pisteet.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista. Jos puu on kaadettu, lisätään teksti "KAADETTU"';
COMMENT ON COLUMN liito_orava_pisteet.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä. Jos havainto on asukashavainto tai esim. luontokartoittajan vapaa- ajalla tekemä havainto, niin se on hyvä merkitä.';
COMMENT ON COLUMN liito_orava_pisteet.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_pisteet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu" tai "tarkkuusmitattu". "Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. sähköposti-ilmoitus, jossa kuvaillaan sijainti. Erittäin vanhoissa saattaa on merkintä +- 100 m, mutta sitä ei laiteta enää uusiin.';

-- ************************
-- Liito-orava aluetaulukko

CREATE TYPE liito_orava_aluetyyppi AS ENUM ('Ydinalue', 'Elinalue', 'Soveltuva'); -- Alue -> Elinalue

CREATE TABLE liito_orava_alueet (
     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     pvm DATE NOT NULL,
     havaitsija TEXT NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
     aluetyyppi liito_orava_aluetyyppi NOT NULL,
     aluekuvaus TEXT,
     koko REAL NOT NULL,
     lisatieto TEXT,
     viite TEXT NOT NULL,
     kunta INTEGER CHECK ( kunta > 0 AND kunta < 1000),
     tarkkuus luontotieto_mittaustyyppi NOT NULL,
     geom geometry(POLYGON, 3879) NOT NULL
);

CREATE INDEX liito_orava_alueet_idx ON liito_orava_alueet USING gist(geom);

COMMENT ON COLUMN liito_orava_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN liito_orava_alueet.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN liito_orava_alueet.aluetyyppi IS 'Alueet luokitellaan ydinalueeksi, alueeksi ja soveltuvaksi alueeksi asiantuntijan arvion mukaan. YDINALUE = todettujen tai mahdollisten pesäpuiden lähiympäristö suojapuustoineen, voi sisältää myös papanapuita. Sisältää liito-oravan lisääntymis- ja levähdyspaikan. ALUE = liito- oravan käyttämä elinalue lajille parhaiten elämiseen soveltuva metsäalue, josta on löytynyt liito-oravan jätöksiä. Alueet ovat metsiköitä, joita liito-orava todistettavasti on käyttänyt ennen kartoituskäyntiä. Alueen sisältä ei ole kartoituskerralla havaittu lisääntymis- ja levähdyspaikkaa. SOVELTUVA = metsä, jossa on liito-oravalle sopivaa puustoa (mm. kookkaita kuusia ja haapoja), mutta josta ei ole löytynyt liito-oravan jätöksiä. Voi olla myös erillään liito- oravan elinympäristöstä tai ydinalueesta.';
COMMENT ON COLUMN liito_orava_alueet.aluekuvaus IS 'Alueesta annetaan muutamalla sanalla kuvaus';
COMMENT ON COLUMN liito_orava_alueet.koko IS 'Alueen koko hehtaareina, MapInfo: "Päivitä sarake" --> CartesianArea(obj, "sq km") * 100';
COMMENT ON COLUMN liito_orava_alueet.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN liito_orava_alueet.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä';
COMMENT ON COLUMN liito_orava_alueet.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_alueet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS" tai "muu", joka tarkoittaa arviota paikasta ilman laitteistoa. Erittäin vanhoissa saattaa on merkintä +- 100 m, mutta sitä ei laiteta enää uusiin.';

-- ************************
-- Liito-orava yhteydet

CREATE TABLE liito_orava_yhteysviivat (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        vuosi INTEGER NOT NULL DEFAULT date_part('year', now()) CHECK ( vuosi > 1900 AND vuosi < 2100 ),
        havaitsija TEXT NOT NULL DEFAULT '-' CHECK ( havaitsija <> ''),
        laatu TEXT NOT NULL,
        lisatieto TEXT,
        pituus REAL NOT NULL,
        viite TEXT NOT NULL,
        kunta INTEGER CHECK ( kunta > 0 AND kunta < 1000),
        tarkkuus luontotieto_mittaustyyppi NOT NULL,
        geom geometry(LINESTRING, 3879) NOT NULL
);

CREATE INDEX liito_orava_yhteysviivat_idx ON liito_orava_yhteysviivat USING gist(geom);

COMMENT ON COLUMN liito_orava_yhteysviivat.vuosi IS 'Vuosi, jolloin havainto on tehty.';
COMMENT ON COLUMN liito_orava_yhteysviivat.havaitsija IS 'Jos havainto on tehty toimeksiannon pohjalta, tulee yrityksen virallinen nimi (Oy:t mukaan). Jos yksityishenkilö, käytetään "-"-viivamerkkiä yksityisyyden suojan vuoksi. Havaitsijataho voi olla myös Espoon kaupunki.';
COMMENT ON COLUMN liito_orava_yhteysviivat.pituus IS 'Yhteysviivan pituus metreinä.';
COMMENT ON COLUMN liito_orava_yhteysviivat.lisatieto IS 'Vapaaehtoinen kenttä, joka jätetään suurimmaksi osaksi tyhjäksi. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN liito_orava_yhteysviivat.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä';
COMMENT ON COLUMN liito_orava_yhteysviivat.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_yhteysviivat.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS" tai "muu", joka tarkoittaa arviota paikasta ilman laitteistoa. Erittäin vanhoissa saattaa on merkintä +- 100 m, mutta sitä ei laiteta enää uusiin.';
