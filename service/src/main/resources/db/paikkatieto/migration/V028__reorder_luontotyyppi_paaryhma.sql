-- in migration V026 the new value 'Rakennettu ympäristö' was added before 'Muu'
-- to the enum type luontotyyppi_paaryhma. This change of order caused issues
-- since in other systems the index is used as an identifier.

-- This migration reorders the enum values to the original order by recreating the enum type.

ALTER TYPE luontotyyppi_paaryhma RENAME TO luontotyyppi_paaryhma_old;

CREATE TYPE luontotyyppi_paaryhma AS ENUM (
    'Lehdot', 'Kangasmetsät', 'Metsien erikoistyypit',
    'Suot', 'Kalliometsät/kalliot', 'Itämeri', 'Rannikko',
    'Sisävedet ja rannat', 'Perinnebiotoopit', 'Uusympäristö', 'Muu',
    'Rakennettu ympäristö'
);

ALTER TABLE luontotyypit_alueet ALTER COLUMN luontotyyppi_paaryhma TYPE luontotyyppi_paaryhma USING luontotyyppi_paaryhma::text::luontotyyppi_paaryhma;

DROP TYPE luontotyyppi_paaryhma_old;
