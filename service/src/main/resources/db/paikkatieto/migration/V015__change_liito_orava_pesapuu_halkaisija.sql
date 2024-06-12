ALTER TABLE liito_orava_pisteet
    DROP CONSTRAINT liito_orava_pisteet_halkaisija_check;

ALTER TABLE liito_orava_pisteet
    ADD CONSTRAINT liito_orava_pisteet_halkaisija_check CHECK ( halkaisija >= 0 AND halkaisija <= 600);
