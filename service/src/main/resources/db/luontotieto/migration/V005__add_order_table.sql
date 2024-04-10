CREATE TABLE "order"
(
    id          UUID                              DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT                     NOT NULL,
    description TEXT                     NOT NULL,
    plan_number TEXT,
    created     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by  UUID                     NOT NULL REFERENCES users (id),
    updated_by  UUID                     NOT NULL REFERENCES users (id)
);

CREATE TRIGGER set_order_timestamp
    BEFORE UPDATE
    ON "order"
    FOR EACH ROW
EXECUTE PROCEDURE trigger_refresh_updated();

ALTER TABLE report ADD COLUMN order_id UUID NULL REFERENCES "order" (id);

CREATE TYPE order_document_type AS ENUM (
    'order:info',
    'order:area'
    );


CREATE TABLE order_file
(
    id            UUID                              DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id      UUID                     NOT NULL REFERENCES "order" (id),
    description   TEXT,
    media_type    TEXT                     NOT NULL,
    file_name     TEXT                     NOT NULL,
    document_type order_document_type      NOT NULL,
    created       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by    UUID                     NOT NULL,
    updated_by    UUID                     NOT NULL,
    UNIQUE (order_id, file_name)
);

CREATE TRIGGER set_order_file_timestamp
    BEFORE UPDATE
    ON "order_file"
    FOR EACH ROW
EXECUTE PROCEDURE trigger_refresh_updated();

CREATE TABLE order_report_document
(
    order_id      UUID                     NOT NULL REFERENCES "order" (id),
    description   TEXT,
    document_type document_type            NOT NULL,
    PRIMARY KEY (order_id, document_type)
);


