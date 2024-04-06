const categoryM = require("../models/category.m");
const HttpError = require('../models/http-error')

const productM = require('../models/product.m');

module.exports = {
    getAllCat: async (req, res, next) => {
        try {
            const category = await categoryM.getAll();
            res.json(category)
        } catch (error) {
            console.error(error)
            return next (new HttpError("Some error orrcurs", 500))
        }
    },

    getByPage: async (req, res, next) => {
        try {
            const page = req.query.page || 1;
            const pageSize = 7; // số dòng trên 1 trang
            const category = await categoryM.getByPage(page, pageSize);
            res.json(category)
        } catch (error) {
            next(error)
        }
    },

    addCategory: async (req, res, next) => {
        try {
            // const maxCatID = await categoryM.getMaxID();
            const entity = {
                // CatID: maxCatID.max + 1,
                CatName: req.body.CatName
            }
            const data = await categoryM.add(entity);
            res.json({success: true, data:data})
        } catch (error){
            onsole.error(error)
            return next (new HttpError("Some error orrcurs", 500))
        }
    },

    deleteCategory: async (req, res, next) => {
        try {
            const catID = req.query.CatID;
            const data2 = await productM.updateCatID(catID, 7);
            const data = await categoryM.deleteByID(catID);
            res.json({ success: true, data: data })
        } catch (error) {
            onsole.error(error)
            return next (new HttpError("Some error orrcurs", 500))
        }
    },

    updateCategory: async (req, res, next) => {
        try{
            const entity = {
                CatID: req.body.CatID,
                CatName: req.body.CatName
            }
            const data = await categoryM.updateByID(entity, entity.CatID);
            res.json({success: true, data:data})
        } catch (error){
            next(error);
        }
    }

}