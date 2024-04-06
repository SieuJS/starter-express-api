const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});

const tbName = "Products";
module.exports = class Product{
    static async getByCat(catID) {
        try {
            const data = await db.any(`SELECT * FROM "${tbName}" tb1 JOIN "Categories" tb2 ON tb1."CatID" = tb2."CatID" WHERE tb2."CatID" = ${catID}`, [catID]);
            return data;
        } catch (error) {
            throw error
        }
    }

    static async getByProID(proID) {
        try {
            const data = await db.any(`SELECT * FROM "${tbName}" WHERE "ProID" = ${proID}`, [proID]);
            return data;
        } catch (error) {
            throw error
        }
    }

    static async getMaxID() {
        try {
            const data = await db.one(`SELECT MAX("ProID") FROM "${tbName}"`);
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async add(entity) {
        try {
            const query = pgp.helpers.insert(entity, null, tbName);
            const data = await db.one(query + `RETURNING "ProID"`);
            return data;
        } catch (err) {
            throw err;
        }
    }
    static async getById(_id) {
        const rs = await db.query(`SELECT * FROM "Products" WHERE "ProID" = ${_id}`);
        return rs;
    }

    static async updateProduct(entity) {
        try {
            // update_product is a custome procedure of Postgresql database
            await db.proc("proc_update_product", [
                entity.ProID,
                entity.ProName,
                entity.TinyDes,
                entity.FullDes,
                entity.Price,
                entity.CatID,
                entity.Quantity,
                entity.Image
            ])
        } catch (error) {
            throw error;
        }
    }

    static async updateCatID(currentCatID, newCatID) {
        try {
            const query = `UPDATE "${tbName}" SET "CatID" = ${newCatID} WHERE "CatID" = ${currentCatID}`
            const data = await db.oneOrNone(query);
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async deleteProduct(proID) {
        try {
            // update_product is a custome procedure of Postgresql database
            await db.proc("proc_delete_product", [proID])
        } catch (error) {
            throw error;
        }
    }

    static async getByPage(catID, name, page, pageSize, sort) {
        try {
            const offset = (page - 1) * pageSize;
            const limit = pageSize;
            const catCondition = catID ? `AND "CatID" = ${catID}` : ''
            let sortCondition = '';
            if (sort === 'asc') sortCondition = `ORDER BY "Price" ASC`;
            else if (sort=== 'desc') sortCondition = `ORDER BY "Price" DESC`
            const data = await db.any(`SELECT * FROM "${tbName}" WHERE "ProName" ILIKE '%${name}%' ${catCondition} ${sortCondition} LIMIT ${limit} OFFSET ${offset}`);
            const total = await db.one(`SELECT COUNT(*) FROM "${tbName}" WHERE "ProName" ILIKE '%${name}%' ${catCondition}`);
            const totalData = parseInt(total.count)
            const totalPage = Math.ceil(totalData / pageSize);
            return {
                data: data,
                totalPage: totalPage,
                total: total.count
            }
        } catch (error) {
            throw error;
        }
    }
    static async getSameProduct(proid) {
        try {
            // Lấy thông tin category của sản phẩm có ProID là productId
            const productCategory = await db.one(
              'SELECT "CatID" FROM "Products" WHERE "ProID" = $1',
              proid
            );
        
            // Lấy danh sách 8 sản phẩm ngẫu nhiên có category giống với productCategory.CatID
            const randomProducts = await db.manyOrNone(
              'SELECT * FROM "Products" WHERE "CatID" = $1 AND "ProID" != $2 ORDER BY random() LIMIT 8',
              [productCategory.CatID, proid]
            );
        
            return randomProducts;
          } catch (error) {
            throw(error);
          }
    }
    static async updateQuantity(proid, amount) {
        try {
            const rs = db.query(`UPDATE "Products" SET "Quantity" = "Quantity" + ${amount} WHERE "ProID" = ${proid}`)
        }
        catch (e) {
            throw(e);
        }
    }
    
    // static async getMaxID() {
    //     try {
    //         const data = await db.one(`SELECT MAX("CatID") FROM "${tbName}"`);
    //         return data;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // static async deleteByID(id) {
    //     try {
    //         const data = await db.oneOrNone(`DELETE FROM "${tbName}" WHERE "CatID" = ${id}`);
    //         return data;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // static async updateByID(entity, id) {
    //     try {
    //         // const condition = pgp.as.format(` where "CatID" = ${id}`, entity);
    //         const query = pgp.helpers.update(entity, null, tbName) + ` where "CatID" = ${id}`; 
    //         const data = await db.oneOrNone(query);
    //         return data;
    //     } catch (err) {
    //         throw err;
    //     }
    // }
}