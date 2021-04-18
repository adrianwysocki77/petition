const spicedPg = require("spiced-pg");

const db = spicedPg(
  process.env.DATABASE_URL || "postgres:postgres:postgres@localhost:5432/sign"
);

exports.showAllFromCity = function (city) {
  return db
    .query(
      `SELECT first, last, age, url
            FROM users
            JOIN signatures
            ON users.id = signatures.user_id
            JOIN user_profiles
            ON users.id = user_profiles.user_id
            WHERE LOWER(city) = LOWER($1)`,
      [city]
    )
    .then(({ rows }) => rows);
};

exports.addData = function (signature, user_id) {
  return db.query(
    `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2) RETURNING user_id`,
    [signature, user_id]
  );
};

exports.getAll = function () {
  return db.query(`SELECT * FROM signatures WHERE id > 0`);
};

exports.addUsers = function (first, last, email, password) {
  return db.query(
    `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`, ///zapobiega atakom  //
    [first, last, email, password]
  );
};

exports.getUsers = function (email) {
  return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
};

exports.checkSign = function (user_id) {
  return db.query(
    `SELECT user_id, signature FROM signatures WHERE user_id = $1`,
    [user_id]
  );
};

exports.getName = function (id) {
  return db.query(`SELECT first, last FROM users WHERE id = $1`, [id]);
};

exports.getAllInfo = function () {
  return db.query(
    `SELECT first, last, email, signature, age, city, url
        FROM users
        JOIN
        signatures
        ON
        users.id = signatures.user_id
        JOIN
        user_profiles
        ON
        users.id = user_profiles.user_id
        `
  );
};

exports.getAllForEdit = function (user_id) {
  return db.query(
    `SELECT *
        FROM users
        LEFT OUTER JOIN
        user_profiles
        ON
        users.id = user_profiles.user_id
        WHERE user_id = $1`,
    [user_id]
  );
};

exports.addProfile = function (age, city, url, user_id) {
  return db.query(
    `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age =$1, city =$2, url =$3`,
    [age || null, city, url, user_id]
  );
};

exports.updateFirstLastPasswordEmail = function (
  first,
  last,
  email,
  password,
  id
) {
  return db.query(
    `UPDATE users SET first =$1, last =$2, email =$3, password =$4
        WHERE id = $5`,
    [first, last, email, password, id]
  );
};

exports.updateFirstLastNoPasswordEmail = function (first, last, email, id) {
  return db.query(
    `UPDATE users SET first =$1, last =$2, email =$3
        WHERE id = $4`,
    [first, last, email, id]
  );
};

exports.addOrUpdateAgeCityHomepage = function (age, city, url, user_id) {
  return db.query(
    `INSERT INTO user_profiles (age, city, url, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET age =$1, city =$2, url =$3`,
    [age || null, city, url, user_id]
  );
};

exports.getPeopleByCity = function (city) {
  return db.query(
    `SELECT first, last, signature, age, city, url
        FROM users
        JOIN
        signatures
        ON
        users.id = signatures.user_id
        JOIN
        user_profiles
        ON
        users.id = user_profiles.user_id WHERE LOWER (city) = LOWER ($1)
        `,
    [city]
  );
};

exports.deleteSignature = function (user_id) {
  return db.query(
    `DELETE FROM signatures
        WHERE user_id = $1`,
    [user_id]
  );
};

exports.deleteProfile = function (user_id) {
  return db.query(
    `DELETE FROM user_profiles
        WHERE user_id = $1`,
    [user_id]
  );
};

exports.deleteUser = function (user_id) {
  return db.query(
    `DELETE FROM users
        WHERE id = $1`,
    [user_id]
  );
};

exports.getAllInfo = function () {
  return db.query(
    `SELECT *
        FROM images
        JOIN
        tags
        ON
        images.id = tags.image_id
        `
  );
};

exports.getAllInfo = function () {
  return db.query(
    `SELECT first, last, email, signature, age, city, url
        FROM users
        JOIN
        signatures
        ON
        users.id = signatures.user_id
        JOIN
        user_profiles
        ON
        users.id = user_profiles.user_id
        `
  );
};
