ALTER TABLE lumo_alueet
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE lahteet_pisteet
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE ekoyhteydet_alueet
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE ekoyhteydet_viivat
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE lepakko_alueet
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE lepakko_viivat
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE noro_viivat
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE aluerajaus_luontoselvitys
    ALTER COLUMN selvitys_id DROP NOT NULL;
ALTER TABLE aluerajaus_luontoselvitystilaus
    ALTER COLUMN selvitys_id DROP NOT NULL;
