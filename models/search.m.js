const db = require("../utils/db");

module.exports = {
    async getProductbySearch(name, catid, min, max) {
        var queryString = `SELECT * FROM "Products" WHERE "ProName" ILIKE '%${name}%'`;
        if (catid != null) {
            let catidArr = catid.split(',');
            queryString += ` AND "CatID" IN (${catid})`
        }
        if (min != null) {
            queryString += ` AND "Price" >= ${min}`
        }
        if (max != null) {
            queryString += ` AND "Price" <= ${max}`
        }

        // const startIndex = (page - 1) * productsPerPage;
        // const endIndex = startIndex + productsPerPage;
        // queryString += ` OFFSET ${startIndex} LIMIT ${productsPerPage}`
        
        console.log(queryString);
        const data = db.query(queryString);
        return data;
    }
}