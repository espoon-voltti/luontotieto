-- Luontotyypit alueet
COMMENT ON COLUMN luontotyypit_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN luontotyypit_alueet.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN luontotyypit_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN luontotyypit_alueet.nimi IS 'Kohteen nimi. Kenttä täytetään, jos se on järkevää ja kohteella on nimi.';
COMMENT ON COLUMN luontotyypit_alueet.luontotyyppi_paaryhma IS 'Valitaan listasta: Lehdot, Kangasmetsät, Metsien erikoistyypit, Suot, Kalliometsät/kalliot, Itämeri, Rannikko, Sisävedet ja rannat, Perinnebiotoopit, Uusympäristö, Muu. Kuvio voi sisältää vain yhden luontotyypin pääryhmän. Luontotyyppimääritelmät perustuvat vuoden 2018 julkaisuun Suomen luontotyyppien uhanalaisuus 2018.';
COMMENT ON COLUMN luontotyypit_alueet.luontotyyppi IS 'Luontotyypin tyyppi. Esim. nuori lehtomainen kangas, tuore keskiravinteinen lehto, varttunut havupuuvaltainen lehtomainen kangas, ruohokorpi, kostea heinäniitty. Luontotyypin tarkin mahdollinen tyyppi luontotyyppien punaisen kirjan mukaisesti. Jos kyseessä on muu, kuin punaisen kirjan luontotyyppi, kirjataan luontotyypin nimi (esim. joutomaa). Kuvio voi sisältää vain yhden luontotyypin tyypin. Luontotyyppimääritelmät perustuvat vuoden 2018 julkaisuun Suomen luontotyyppien uhanalaisuus 2018. Lähtökohtaisesti kaikki luontotyypit kuvioidaan pinta-alasta riippumatta. On olennaista, että kaikki yksittäisen aluekokonaisuuden luontotyypit huomioidaan pienialaisinakin. Luontotyyppien määrittäminen yhteen luokkaan voi olla tapauskohtaisesti haasteellista, esimerkiksi kulttuurivaikutteisuuden takia. Tilanteissa, joissa yhden luontotyypin valinta on liian hankalaa, on oleellisempaa rajata luontevia kokonaisuuksia, jotka rakenteellisesti muodostavat yhtenäisen kuvion. Nämä luokitellaan vallitsevan luontotyypin mukaan. Luontotyyppien määritelmävaihtoehdoista valitaan aina parhaiten kohteen inventointihetken tilannetta vastaava.';
COMMENT ON COLUMN luontotyypit_alueet.uhanalaisuusluokka IS 'Uhanalaisen luontotyypin uhanalaisuusluokka (CR, EN, VU, NT, LC, DD, NE). Jos kohde ei uhanalainen luontotyyppi, saraketta ei täytetä ja se jätetään tyhjäksi. Viimeisin uhanalaisarvio ja Etelä-Suomen uhanalaisuusluokat.';
COMMENT ON COLUMN luontotyypit_alueet.edustavuus IS 'Valitaan listasta: Erinomainen (1), Hyvä (2), Kohtalainen (3), Heikko (4), Muu (5) (esim. perattu puro, ojikko tms.). Kuvion edustavuutta arvioidaan suhteessa luontotyypin ominaispiirteisiin, tunnuslajeihin, luonnontilaisuuteen, kuluneisuuteen ja ihmisvaikutukseen. Kohteiden edustavuuden arvioinnin ohjeistus on Kriteeristö luontoarvojen luokitteluun Espoossa, joka perustuu mm. luonnonsuojelulain luontotyyppien inventointiohjeeseen ja uhanalaisten luontotyyppien kuvaukseen.';
COMMENT ON COLUMN luontotyypit_alueet.kuvaus IS 'Tiivis sanallinen kuvaus kohteesta ja sen piirteistä';
COMMENT ON COLUMN luontotyypit_alueet.lisatieto IS 'Mahdolliset täydentävät kommentit, lisätietoa kohteesta. Muut kuvion luontotyypit, jos kuvio on muodostettu useammasta luontotyypistä, jotka rakenteellisesti muodostavat yhtenäisen kuvion ja jonka vallitseva luontotyyppi on merkitty Luontotyyppi-sarakkeeseen.';
COMMENT ON COLUMN luontotyypit_alueet.ominaislajit IS 'Kyseistä luontotyyppikuviota indikoivat kenttäkerroksen ominaislajit.';
COMMENT ON COLUMN luontotyypit_alueet.uhanalaiset_lajit IS 'Havaitut tai aiemmin tiedossa olleet havainnot huomionarvoisista lajeista.';
COMMENT ON COLUMN luontotyypit_alueet.lahopuusto IS 'Asteikolla: Runsaasti - Kohtalaisesti - Vähän - Ei lahopuuta. Arvioidaan metsäisten luontotyyppien osalta. Lahopuuston määrä maa- ja pystypuuna. Runsaus arvioidaan koko kuvion laajuudelta ja suhteutetaan kuvion kokoon.';
COMMENT ON COLUMN luontotyypit_alueet.lumo_luokka IS 'Kohteen luokittelu Espoon luontoarvojen kriteeristön perusteella, mikäli se on kohteen kannalta asianmukaista ja toimivaa. Jos kohdetta ei voida luokitella Lumo-luokkiin 1–4, laitetaan arvoksi 0. Luokat 1–4 (1: Ehdoton, 2: Tiukka, 3: Huomioitava, 4: Joustava)';
COMMENT ON COLUMN luontotyypit_alueet.pinta_ala IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN luontotyypit_alueet.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN luontotyypit_alueet.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';

-- Ekoyhteydet alueet
COMMENT ON COLUMN ekoyhteydet_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN ekoyhteydet_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai ekoyhteys määritelty.';
COMMENT ON COLUMN ekoyhteydet_alueet.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN ekoyhteydet_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN ekoyhteydet_alueet.laatu IS 'Arvio ekologisen yhteyden toimivuudesta. Luokitellaan joko toimivaksi tai kehitettäväksi/heikoksi. Valitaan seuraavista: Toimiva. (Yhteys on nykyisellään toimiva.), Kehitettävä tai heikko yhteys.( Yhteys on heikko tai alueella on yhteyden kehittämisen tarve.)';
COMMENT ON COLUMN ekoyhteydet_alueet.lisatieto IS 'Vapaa sanallinen kuvaus ekologisen yhteyden nykytilasta. Arvio yhteyden jatkosta, esim. "Reitti tarpeen säilyttää puustoisena (leveys 100–200 m)". Tarvittaessa kuvaus siitä, onko yhteys puustoinen ja osa laajempaa metsäverkostoa? Esimerkiksi "Metsäinen, puustoinen. Yhteys on nykyisellään metsäinen ja/tai puustoinen.", "Virtavesi, vesistöyhteys. Yhteys on heikko tai yhteys on heikko ja tarvitsee parantamistoimenpiteitä.". Lisätietoja ja muita huomioitavia tekijöitä kohteesta.';
COMMENT ON COLUMN ekoyhteydet_alueet.pinta_ala IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN ekoyhteydet_alueet.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN ekoyhteydet_alueet.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';

-- Ekoyhteydet viivat
COMMENT ON COLUMN ekoyhteydet_viivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN ekoyhteydet_viivat.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai ekoyhteys määritelty';
COMMENT ON COLUMN ekoyhteydet_viivat.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN ekoyhteydet_viivat.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN ekoyhteydet_viivat.laatu IS 'Arvio ekologisen yhteyden toimivuudesta. Luokitellaan joko toimivaksi tai kehitettäväksi/heikoksi. Valitaan seuraavista: Toimiva. (Yhteys on nykyisellään toimiva.), Kehitettävä tai heikko yhteys.( Yhteys on heikko tai alueella on yhteyden kehittämisen tarve.)';
COMMENT ON COLUMN ekoyhteydet_viivat.lisatieto IS 'Vapaa sanallinen kuvaus ekologisen yhteyden nykytilasta. Arvio yhteyden jatkosta, esim. "Reitti tarpeen säilyttää puustoisena (leveys 100–200 m)". Tarvittaessa kuvaus siitä, onko yhteys puustoinen ja osa laajempaa metsäverkostoa? Esimerkiksi "Metsäinen, puustoinen. Yhteys on nykyisellään metsäinen ja/tai puustoinen.", "Virtavesi, vesistöyhteys. Yhteys on heikko tai yhteys on heikko ja tarvitsee parantamistoimenpiteitä.". Lisätietoja ja muita huomioitavia tekijöitä kohteesta.';
COMMENT ON COLUMN ekoyhteydet_viivat.pituus IS 'Yhteyden pituus metreinä';
COMMENT ON COLUMN ekoyhteydet_viivat.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN ekoyhteydet_viivat.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';

-- Lähteet pisteet

COMMENT ON COLUMN lahteet_pisteet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN lahteet_pisteet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai kohde määritelty.';
COMMENT ON COLUMN lahteet_pisteet.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN lahteet_pisteet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN lahteet_pisteet.tyyppi IS 'Kohteen lähteikkö/lähdetyyppi.';
COMMENT ON COLUMN lahteet_pisteet.lisatieto IS 'Kuvaus kohteen luonnontilaisuudesta. Tiivis sanallinen kuvaus kohteesta.';
COMMENT ON COLUMN lahteet_pisteet.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN lahteet_pisteet.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';
