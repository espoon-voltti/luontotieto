CREATE TYPE vieraslajit_elioryhma AS ENUM (
    'Hyönteiset ja hämähäkkieläimet',
    'Kalat',
    'Levät',
    'Linnut',
    'Madot',
    'Matelijat ja sammakkoeläimet',
    'Muut organismit',
    'Nilviäiset',
    'Nisäkkäät',
    'Putkilokasvit',
    'Sammalet',
    'Sienet ja jäkälät',
    'Tuhatjalkaiset',
    'Äyriäiset'
    );

ALTER TABLE vieraslajit_alueet ADD COLUMN elioryhma vieraslajit_elioryhma NOT NULL DEFAULT 'Putkilokasvit';
ALTER TABLE vieraslajit_alueet ALTER COLUMN elioryhma DROP DEFAULT;
COMMENT ON COLUMN vieraslajit_alueet.elioryhma IS 'Eliöryhmä, johon laji kuuluu. Valitaan listasta sopiva.';

ALTER TABLE vieraslajit_pisteet ADD COLUMN elioryhma vieraslajit_elioryhma NOT NULL DEFAULT 'Putkilokasvit';
ALTER TABLE vieraslajit_pisteet ALTER COLUMN elioryhma DROP DEFAULT;
COMMENT ON COLUMN vieraslajit_pisteet.elioryhma IS 'Eliöryhmä, johon laji kuuluu. Valitaan listasta sopiva.';

ALTER TABLE vieraslajit_pisteet ADD COLUMN tarkkuus luontotieto_mittaustyyppi;
COMMENT ON COLUMN vieraslajit_pisteet.tarkkuus IS 'Tarkkuustasoksi laitetaan joko "GPS", "muu" tai "tarkkuusmitattu". "Muu" tarkoittaa arviota paikasta ilman laitteistoa, esim. sähköposti-ilmoitus, jossa kuvaillaan sijainti. Erittäin vanhoissa saattaa on merkintä +- 100 m, mutta sitä ei laiteta enää uusiin.';

ALTER TABLE vieraslajit_pisteet ADD COLUMN koordinaatti_tarkkuus REAL DEFAULT 0;
COMMENT ON COLUMN vieraslajit_pisteet.koordinaatti_tarkkuus IS 'Havaintopaikan koordinaattien arvioitu heitto metreissä. Havaintojen paikalle määritelty karkea tarkkuus metreinä, esimerkiksi 1 metri tai 10 metriä.';
