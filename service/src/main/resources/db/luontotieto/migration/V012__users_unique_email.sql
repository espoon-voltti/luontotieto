UPDATE users u
SET email = null
WHERE EXISTS (
    SELECT * FROM users u2
    WHERE u.email = u2.email AND u.created > u2.created
);

ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

