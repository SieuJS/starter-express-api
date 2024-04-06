const db = require("../utils/db");
const pgp = require("pg-promise")({capSQL: true});

module.exports = class Account {
    constructor({Name, Username, Email, Password, DOB, Role, Permission}) {
        this.Name = Name;
        this.Username = Username;
        this.Email = Email;
        this.Password = Password;
        this.DOB = DOB;
        this.Role = Role;
        this.Permission = Permission;
    }

    static async getByUsername(un) {
        try {
            const data = await db.oneOrNone(`SELECT * FROM "Users" WHERE "Username" = $1`, [un]);
            return data;
        } catch (error) {
            throw error
        }
    }

    static async getByUserID(id) {
        try {
            const data = await db.oneOrNone(`SELECT * FROM "Users" WHERE "ID" = $1`, [id]);
            return data;
        } catch (error) {
            throw error;
        }
    }

    static async add(acc) {
        try {
            const query = pgp.helpers.insert(acc, null, "Users");
            const data = await db.one(query + "RETURNING *");
            return data;
        } catch (err) {
            throw err;
        }
    }

    static async updateUser(newValues) {
        // update_user is a custome function of Postgresql database
        const data = await db.func("update_user", newValues);
        return data;
    }

    static async updatePermission(userId, permission) {
        const data = await db.oneOrNone(`Update "Users" Set "Permission" = $1 Where "ID" = $2`, [permission, userId]);
        return data;
    }

    static async deleteUser(username) {
        try {
            // update_user is a custome procedure of Postgresql database
            await db.proc("proc_delete_user", [username])
        } catch (error) {
            throw error;
        }
    }

    static async lockUser(uid) {
        try {
        const data = await db.func("lock_acc", [uid])
        return data
        }
        catch (err){
            throw err
        }
    }
    static async getList (pageSize = 5, pageNum = 1)  {
        try {
            let totalPage , data , totalRecords ;
            totalRecords = await db.one('SELECT Count(*) FROM "Users"');
            totalPage =Math.ceil(totalRecords.count / pageSize);
            data = await db.func('get_list_users', [pageSize, pageNum]);
            return {totalPage , data}
        }
        catch (err){
            throw err
        }
    }

    static async getPermission (userId)  {
        try {
            const data = await db.oneOrNone(`SELECT "Permission" FROM "Users" WHERE "ID" =$1`, [userId]);
            return data
        }
        catch (err){
            throw err
        }
    }
}