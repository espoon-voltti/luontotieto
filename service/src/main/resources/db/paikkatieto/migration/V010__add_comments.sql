-- Lepakko viivat
COMMENT ON COLUMN lepakko_viivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN lepakko_viivat.pvm IS 'Päivämäärä, jolloin havainto on tehty tai reitti määritelty.';
COMMENT ON COLUMN lepakko_viivat.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN lepakko_viivat.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN lepakko_viivat.kuvaus IS 'Sanallinen kuvaus reitistä ja sen merkityksestä lajille. Esimerkiksi "Lepakoille tärkeä siirtymäreitti”, ”Siirtymäreitti, joka vastaa II-luokan aluetta. Reitti tarpeen säilyttää puustoisena (leveys 100–200 m).".';
COMMENT ON COLUMN lepakko_viivat.pituus IS 'Viivan (reitin) pituus metreinä.';
COMMENT ON COLUMN lepakko_viivat.lisatieto IS 'Lisätietoja reitistä ja sen laadusta. Mahdollisia tarkempia mainintoja esiintymän laadusta tai muu arvoperuste (hot spot, lisääntymiskolonia, ruokailualue tms.).';
COMMENT ON COLUMN lepakko_viivat.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN lepakko_viivat.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';


--Lepakko alueet
COMMENT ON COLUMN lepakko_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN lepakko_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai alue määritelty.';
COMMENT ON COLUMN lepakko_alueet.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN lepakko_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN lepakko_alueet.luokka IS 'Lepakkoalueet luokitellaan kolmeen luokkaan seuraavasti: Luokka I, Luokka II, Luokka III. Luokka 1: Lainsäädännöllä suojellut kohteet. Luokka 2: Erityisen tärkeät kohteet. Luokka 3: Monimuotoisuutta tukevat ja turvaavat kohteet.';
COMMENT ON COLUMN lepakko_alueet.pinta_ala IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN lepakko_alueet.lisatieto IS 'Kuvaus alueen lajirunsaudesta ja lajimääristä. Lisätietoja havainnosta, alueesta ja sen laadusta. Mahdollisia tarkempia mainintoja esiintymän laadusta tai muu arvoperuste (hot spot, lisääntymiskolonia, ruokailualue tms.).';
COMMENT ON COLUMN lepakko_alueet.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN lepakko_alueet.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';


-- Lumo alueet
COMMENT ON COLUMN lumo_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN lumo_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai alue määritelty.';
COMMENT ON COLUMN lumo_alueet.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN lumo_alueet.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN lumo_alueet.nimi IS 'Kohteen nimi. Kenttä täytetään, jos se on järkevää ja kohteella on nimi.';
COMMENT ON COLUMN lumo_alueet.lumo_luokka IS 'Kohteen luokittelu Espoon luontoarvojen kriteeristön perusteella. Luokat 1–4 (1: Ehdoton, 2: Tiukka, 3: Huomioitava, 4: Joustava).';
COMMENT ON COLUMN lumo_alueet.lisatieto IS 'Mahdolliset täydentävät kommentit, lisätietoa kohteesta.';
COMMENT ON COLUMN lumo_alueet.pinta_ala IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN lumo_alueet.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN lumo_alueet.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';


-- Noro viivat
COMMENT ON COLUMN noro_viivat.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN noro_viivat.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty tai kohde määritelty.';
COMMENT ON COLUMN noro_viivat.vuosi IS 'Havainnon vuosiluku.';
COMMENT ON COLUMN noro_viivat.havaitsija IS 'Havainnon tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN noro_viivat.tyyppi IS 'Kohteen luontotyyppi, merkitään aina ”Havumetsävyöhykkeen noro”.';
COMMENT ON COLUMN noro_viivat.lisatieto IS 'Kuvaus kohteen luonnontilaisuudesta. Tarvittaessa tiivis sanallinen kuvaus kohteesta ja sen luontotyypistä.';
COMMENT ON COLUMN noro_viivat.pituus IS 'Viivan (noron) pituus metreinä';
COMMENT ON COLUMN noro_viivat.viite IS 'Havainnon lähdeaineisto. Selvityksen täydellinen nimi, ei päivämääriä.';
COMMENT ON COLUMN noro_viivat.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';


ALTER TABLE aluerajaus_luontoselvitystilaus
    ADD COLUMN tilaus_vuosi INTEGER;

-- Aluerajaus luontoselvitystilaus
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.tilauksen_nimi IS 'Tilatun luontoselvityksen nimi.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.tilaus_vuosi IS 'Vuosi, jolloin selvitystilaus on tehty ja jolloin selvitys tehdään.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.tilauksen_tekija IS 'Selvitystilauksen tekijä, tilauksen yhteyshenkilö Espoon kaupungilla.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.tilausyksikko IS 'Selvityksen tilannut yksikkö, tai yksiköt, Espoon kaupungilla tai muu selvityksen tilannut taho.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN aluerajaus_luontoselvitystilaus.selvitys_linkki IS 'Linkki luontoselvitystilaukseen. Generoidaan automaattisesti.';


ALTER TABLE aluerajaus_luontoselvitys
    ADD COLUMN lisatieto TEXT;
ALTER TABLE aluerajaus_luontoselvitys
    ADD COLUMN selvitetyt_tiedot TEXT[];
-- 'Liito-oravat (havaittu), Norot (ei havaittu), Lepakko-alueet (havaittu), Muut huomioitavat lajit (havaittu, Susi, Karhu)'

--  Aluerajaus luontoselvitys
COMMENT ON COLUMN aluerajaus_luontoselvitys.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitys_nimi IS 'Selvityksen täydellinen nimi, ei päivämääriä. Jos havainto on luontokartoittajan vapaa-ajalla tekemä havainto, niin se on hyvä merkitä.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitys_vuosi IS 'Vuosi, jolloin selvitys on tehty.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitys_tekija IS 'Selvityksen tekijän yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN aluerajaus_luontoselvitys.tilausyksikko IS 'Selvityksen tilannut yksikkö, tai yksiköt, Espoon kaupungilla tai muu selvityksen tilannut taho.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.pinta_ala IS 'Alueen koko hehtaareina. Generoidaan automaattisesti';
COMMENT ON COLUMN aluerajaus_luontoselvitys.lisatieto IS 'Lisätietoja selvityksestä. Tähän voi kirjoittaa, jos selvityksessä on jotain omasta mielestä erityistä mainitsemisen arvoista.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitetyt_tiedot IS 'Selvityksessä selvitetyt tiedot.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitys_id IS 'Selvityksen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN aluerajaus_luontoselvitys.selvitys_linkki IS 'Linkki tehtyyn selvitykseen. Generoidaan automaattisesti.';
