const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pgp = require('pg-promise')({
    capSQL: true
});

const cn = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DB,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    max: 30
};
const db = pgp(cn);
module.exports = db;
