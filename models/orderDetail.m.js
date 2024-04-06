const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});
const tbName = "OrderDetails";

module.exports = class orderDetail {
    constructor(orderid, product) {
        this.OrderID = orderid,
        this.ProductName = product.ProName,
        this.ProID = product.ProID,
        this.Quantity = product.orderQuantity,
        this.Price = product.Price,
        this.Amount = product.Price * product.orderQuantity
    };
    static async insert (item) {
        const query = pgp.helpers.insert(item,null,tbName) + 'RETURNING "ID"'
        const rs = await db.one(query);
        return rs
    }

    static async getAllDetails(orderId) {
        try {
            const details = await db.manyOrNone(`SELECT * FROM "OrderDetails" WHERE "OrderID" = $1`, [orderId]);
            return details;
        } catch (err) {
            throw err;
        }
    }
}