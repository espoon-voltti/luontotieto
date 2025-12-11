CREATE TYPE natura_edustavuus_luokka AS ENUM ('Erinomainen', 'Hyvä', 'Merkittävä', 'Ei merkittävä');

ALTER TABLE luontotyypit_alueet ADD COLUMN natura_luontotyyppi text;
ALTER TABLE luontotyypit_alueet ADD COLUMN natura_edustavuus natura_edustavuus_luokka;