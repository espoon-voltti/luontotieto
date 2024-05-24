ALTER TABLE report
    DROP COLUMN description;

ALTER TABLE report
    ADD COLUMN no_observations TEXT[];


