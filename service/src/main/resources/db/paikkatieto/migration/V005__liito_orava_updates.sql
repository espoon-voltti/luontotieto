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


CREATE TYPE laatu AS ENUM (
    'Hyvä',
    'Heikko/Parannettava',
    'Yhteystarve');

ALTER TABLE liito_orava_yhteysviivat
    ALTER COLUMN laatu TYPE laatu
        USING laatu::laatu;

COMMENT ON COLUMN liito_orava_pisteet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN liito_orava_pisteet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty.';
COMMENT ON COLUMN liito_orava_pisteet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN liito_orava_pisteet.puulaji IS 'Puulaji, kirjoitettava selkeästi auki, ei lyhenteitä. Esim. haapa, kuusi.';
COMMENT ON COLUMN liito_orava_pisteet.halkaisija IS 'Puun halkaisija arvioituna senttimetreissä rinnankorkeudelta.';
COMMENT ON COLUMN liito_orava_pisteet.papanamaara IS 'Papanoiden määrän arvio absoluuttisena määränä.';
COMMENT ON COLUMN liito_orava_pisteet.pesa IS 'Pesäpuu on puu, jossa kolo/risupesä/pönttö, jonka alla papanoita tai voidaan muilla perustein todeta pesäpuuksi (esimerkiksi näköhavainto, kun liito-orava käyttää pesää). Kartoittajan asiantuntemuksella tehty arvio. Jos kyseessä on kolo / pönttö / risupesä, jota ei voida maastokäynnin perusteella merkitä asutuksi tai käytetyksi pesäksi, sarakkeeseen merkitään "ei". Potentiaalinen pesä ei ole olemassa oleva pesä.';
COMMENT ON COLUMN liito_orava_pisteet.pesatyyppi IS 'Pesätyyppiin on 4 vaihtoehtoa, esim. risupesä on "risu". Jos pesätyyppi ei ole risupesä, kolopesä tai pönttö, se on muu. Jos näkyvää pesätyyppiä ei ole, kohtaan merkitään "-"';
COMMENT ON COLUMN liito_orava_pisteet.pesankorkeus IS 'Pesän arvioitu korkeus metreissä. Jos kyseessä kolopuu ilman todennettua pesää, niin kolon korkeus.';
COMMENT ON COLUMN liito_orava_pisteet.lisatieto IS 'Jos puussa sijaitseva kolo on tarkastettu endoskoopilla eli tarkastuskameralla, tulee tähän sarakkeeseen tieto tarkastuksesta. Lisäksi tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista. Jos puu on kaadettu, lisätään teksti "KAADETTU"';
COMMENT ON COLUMN liito_orava_pisteet.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä. Jos havainto on luontokartoittajan vapaa-ajalla tekemä havainto, niin se on hyvä merkitä.';
COMMENT ON COLUMN liito_orava_pisteet.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_pisteet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu" tai "tarkkuusmitattu". "Tarkkuusmitattu" tarkoittaa sitä, että puun sijainti on varmistettu tarkkuusmittaamalla esim. takymetrillä. "Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. ilmakuvan perusteella merkittyä sijaintia.';

COMMENT ON COLUMN liito_orava_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN liito_orava_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN liito_orava_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN liito_orava_alueet.aluetyyppi IS 'Alueet luokitellaan ydinalueeksi, elinalueeksi ja soveltuvaksi alueeksi asiantuntijan arvion mukaan. YDINALUE = todettujen tai mahdollisten pesäpuiden lähiympäristö suojapuustoineen, voi sisältää myös papanapuita. Sisältää liito-oravan lisääntymis- ja levähdyspaikan. ELINALUE = liito-oravan käyttämä elinalue. Lajille parhaiten elämiseen soveltuva metsäalue, josta on löytynyt liito-oravan jätöksiä. Alueet ovat metsiköitä, joita liito-orava todistettavasti on käyttänyt ennen kartoituskäyntiä. Alueen sisältä ei ole kartoituskerralla havaittu lisääntymis- ja levähdyspaikkaa. SOVELTUVA = metsä, jossa on liito-oravalle sopivaa puustoa (mm. kookkaita kuusia ja haapoja), mutta josta ei ole löytynyt liito-oravan jätöksiä. Voi olla myös erillään liito-oravan elinympäristöstä tai ydinalueesta.';
COMMENT ON COLUMN liito_orava_alueet.aluekuvaus IS 'Alueesta annetaan muutamalla sanalla kuvaus';
COMMENT ON COLUMN liito_orava_alueet.koko IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN liito_orava_alueet.lisatieto IS 'Vapaaehtoinen kenttä. Tähän voi kirjoittaa, jos kohteessa tai ympäristössä on jotain omasta mielestä mainitsemisen arvoista.';
COMMENT ON COLUMN liito_orava_alueet.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä. Jos havainto esimerkiksi luontokartoittajan vapaa-ajalla tekemä havainto, niin se on hyvä merkitä viitteen yhteyteen.';
COMMENT ON COLUMN liito_orava_alueet.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_alueet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu"tai "tarkkuusmitattu"."Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. ilmakuvan perusteella tehtyä aluerajausta. "Tarkkuusmitattu" tarkoittaa sitä, että aluerajaus on varmistettu tarkkuusmittaamalla.';

COMMENT ON COLUMN liito_orava_yhteysviivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN liito_orava_yhteysviivat.vuosi IS 'Vuosi, jolloin havainto on tehty.';
COMMENT ON COLUMN liito_orava_yhteysviivat.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN liito_orava_yhteysviivat.pituus IS 'Yhteysviivan pituus metreinä.';
COMMENT ON COLUMN liito_orava_yhteysviivat.laatu IS 'Kulkuyhteyden nykytilan kuvaus. Hyvä = Yhteys on nykyisellään hyvin toimiva liito-oravan kulkuyhteytenä. Heikko/parannettava = Yhteys on heikko tai yhteys on heikko ja tarvitsee parantamistoimenpiteitä. Yhteystarve = Yhteys on katkennut tai alueella on yhteyden kehittämisen tarve.';
COMMENT ON COLUMN liito_orava_yhteysviivat.lisatieto IS 'Lisätietoja ja muita huomioitavia tekijöitä kohteesta, kuten kulkuyhteyden leveydestä.';
COMMENT ON COLUMN liito_orava_yhteysviivat.viite IS 'Selvityksen täydellinen nimi, ei päivämääriä. Jos havainto esimerkiksi luontokartoittajan vapaa-ajalla tekemä havainto, niin se on hyvä merkitä viitteen yhteyteen.';
COMMENT ON COLUMN liito_orava_yhteysviivat.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN liito_orava_yhteysviivat.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu" tai "tarkkuusmitattu". "Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. ilmakuvan perusteella tehtyä viivaa. "Tarkkuusmitattu" tarkoittaa sitä, että yhteyden sijainti on varmistettu tarkkuusmittaamalla.';