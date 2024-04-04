CREATE TABLE report
(
    id          UUID                              DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT                     NOT NULL,
    description TEXT                     NOT NULL,
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by  UUID                     NOT NULL REFERENCES users (id),
    updated_by  UUID                     NOT NULL REFERENCES users (id)
);

CREATE OR REPLACE FUNCTION public.trigger_refresh_updated() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_timestamp
    BEFORE UPDATE
    ON report
    FOR EACH ROW
EXECUTE PROCEDURE trigger_refresh_updated();

CREATE TYPE document_type AS ENUM (
    'paikkatieto:liito_orava_pisteet',
    'paikkatieto:liito_orava_alueet',
    'paikkatieto:liito_orava_yhteysviivat',
    'luontotieto:report',
    'luontotieto:other'
    );

CREATE TABLE report_file
(
    id            UUID                              DEFAULT gen_random_uuid() PRIMARY KEY,
    description   TEXT,
    report_id     UUID                     NOT NULL REFERENCES report (id),
    media_type    TEXT                     NOT NULL,
    file_name     TEXT                     NOT NULL,
    document_type document_type            NOT NULL,
    created       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by    UUID                     NOT NULL,
    updated_by    UUID                     NOT NULL,
    UNIQUE (report_id, file_name)
);

CREATE TRIGGER set_report_file_timestamp
    BEFORE UPDATE
    ON report_file
    FOR EACH ROW
EXECUTE PROCEDURE trigger_refresh_updated();
