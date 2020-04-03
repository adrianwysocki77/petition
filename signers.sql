DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature VARCHAR NOT NULL CHECK (signature != ''),
    user_id INT NOT NULL REFERENCES users(id)
);
