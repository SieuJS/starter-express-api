const accM = require('../models/acc.m');
const catM = require('../models/category.m');
const productM = require('../models/product.m');

const db = require("./db");
const pgp = require("pg-promise")({capSQL: true});

module.exports = {
    AccStats : async () => {
        try {
            const data  = await db.oneOrNone('SELECT COUNT(*) FROM "Users" Where "Role" != $1' , ['admin']);
            return data.count
        }
        catch (err) {
            throw err
        }
    },
    CatStats : async () => {
        try {
            const data = await db.oneOrNone('SELECT COUNT(*) FROM "Categories"');
            return data.count;
        }
        catch(err) {
            throw err
        }
    },
    ProdStats : async () => {
        try {
            const data = await db.oneOrNone('SELECT COUNT(*) FROM "Products"');
            return data.count;
        }
        catch(err) {
            throw err
        }
    },
    OrderStats : async () => {
        try {
            const data = await db.oneOrNone('SELECT COUNT(*) FROM "Orders"');
            return data.count;
        }
        catch (err) {
            throw err
        }
    }
}