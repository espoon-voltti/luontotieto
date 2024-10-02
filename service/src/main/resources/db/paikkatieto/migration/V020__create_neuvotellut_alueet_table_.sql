CREATE TABLE neuvotellut_alueet
(
    id                 INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    pvm                DATE                      NOT NULL,
    havaitsija         TEXT                      NOT NULL DEFAULT '-' CHECK ( havaitsija <> '' ),
    havaitsija_henkilo TEXT,
    laji               TEXT                      NOT NULL,
    aluetyyppi         TEXT                      NOT NULL,
    aluekuvaus         TEXT                      NOT NULL,
    koko               REAL                      NOT NULL,
    lisatieto          TEXT,
    viite              TEXT                      NOT NULL,
    kunta              INTEGER CHECK ( kunta > 0 AND kunta < 1000),
    tarkkuus           luontotieto_mittaustyyppi NOT NULL,
    geom               geometry(POLYGON, 3879)   NOT NULL
);

CREATE INDEX neuvotellut_alueet_idx ON neuvotellut_alueet USING gist (geom);

COMMENT ON COLUMN neuvotellut_alueet.id IS 'Kohteen yksilöllinen tunniste. Generoidaan automaattisesti.';
COMMENT ON COLUMN neuvotellut_alueet.pvm IS 'Päivämäärä, jolloin havainto on maastossa tehty';
COMMENT ON COLUMN neuvotellut_alueet.havaitsija IS 'Havainnon tekijän organisaatio tai yrityksen virallinen nimi (Oy:t mukaan).';
COMMENT ON COLUMN neuvotellut_alueet.havaitsija_henkilo IS 'Havainnon tekijätieto tarvittaessa.';
COMMENT ON COLUMN neuvotellut_alueet.laji IS 'Laji, johon liittyen aluerajaus on tehty. Esim. liito-orava.';
COMMENT ON COLUMN neuvotellut_alueet.aluetyyppi IS 'Alueet luokitellaan tyypin mukaan';
COMMENT ON COLUMN neuvotellut_alueet.aluekuvaus IS 'Alueesta ja sen rajausperusteista annetaan tiivis kuvaus';
COMMENT ON COLUMN neuvotellut_alueet.koko IS 'Alueen koko hehtaareina';
COMMENT ON COLUMN neuvotellut_alueet.lisatieto IS 'Lisätietoa kohteesta.';
COMMENT ON COLUMN neuvotellut_alueet.viite IS 'Selkeä viite alueen rajausperusteisiin, esim. viittaus ELY-keskuksen päätökseen.';
COMMENT ON COLUMN neuvotellut_alueet.kunta IS 'Kunnan numero: Espoo 49, Helsinki 91, Vantaa 92 ja Kauniainen 235, kunnan numerokoodit löytyvät internetistä.';
COMMENT ON COLUMN neuvotellut_alueet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu"tai "tarkkuusmitattu"."Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. ilmakuvan perusteella tehtyä aluerajausta. "Tarkkuusmitattu" tarkoittaa sitä, että aluerajaus on varmistettu tarkkuusmittaamalla.';


