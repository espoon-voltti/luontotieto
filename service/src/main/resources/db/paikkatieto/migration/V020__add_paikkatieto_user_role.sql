CREATE ROLE paikkatieto_user;

GRANT USAGE ON SCHEMA public TO paikkatieto_user;

-- Add SELECT privilege to all tables in the public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO paikkatieto_user;

REVOKE SELECT ON TABLE public.flyway_schema_history FROM paikkatieto_user;

-- This command will grant SELECT on any future tables that are created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO paikkatieto_user;

-- Add ownership to enable the paikkatieto_user role to alter the tables
ALTER TABLE lajiryhma_alueet
    OWNER TO paikkatieto_user;
ALTER TABLE arvokkaat_luontokohteet_alueet
    OWNER TO paikkatieto_user;
ALTER TABLE arvokkaat_vesikohteet_alueet
    OWNER TO paikkatieto_user;
