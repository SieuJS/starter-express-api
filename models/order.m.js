const db = require("../utils/db");
const pgp = require("pg-promise")({ capSQL: true });
const tbName = "Orders";

module.exports = class Order {
    static async insert(orderdate, userid, total, address, phone, status) {
        const data = {
            "OrderDate": orderdate,
            "UserID": userid,
            "Total": total,
            "Address": address,
            "Phone": phone,
            "Status": status
        }
        const query = pgp.helpers.insert(data, null, tbName) + 'RETURNING "OrderID"';
        const rs = await db.one(query);
        return rs.OrderID;
    }

    static async getByUserId(userId) {
        try {
            const data = await db.manyOrNone(
                `SELECT *
                FROM "Orders"
                WHERE "UserID" = $1`,
                [userId]
            );
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async getByPage(userId, offset, limit) {
        try {
            const data = await db.manyOrNone(
                `
                SELECT *
                FROM "Orders"
                WHERE "UserID" = $1
                ORDER BY "OrderDate" DESC
                OFFSET $2
                LIMIT $3;
                `,
                [userId, offset, limit]
            )
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async getTotalByUserId(userId) {
        try {
            const result = await db.one(`
            SELECT COUNT(*)
            FROM "Orders"
            WHERE "UserID" = $1`, [userId]);
            return parseInt(result.count);
        }catch (err) {
            throw err;
        }
    }

    static async updateStatus(orderid, status) {
        try {
            await db.query(`
            UPDATE "Orders"
            SET "Status" = '${status}'
            WHERE "OrderID" = ${orderid}
            `)
        }
        catch(e) {
            console.log(e);
            throw err;
        }
    }

    static async getAllPending() {
        const rs = await db.query(`
        SELECT * FROM "Orders"
        WHERE "Status" = 'pending'
        `)
        return rs;
    }
}