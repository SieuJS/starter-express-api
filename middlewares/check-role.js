const HttpError = require('../models/http-error')

const jwt = require('jsonwebtoken')
const jwtKey = process.env.JWT_SECRET_KEY;

module.exports = (req,res,next) => {
    try {
        
        const role = req.userData.role;
        if (!role) {
            const error = new Error('Authorization failed');
            throw error;
        }
        if (role.toLowerCase().trim() !== 'admin') {
            const error = new Error('Authorization failed');
            throw error;
        }
        return next();
    }
    catch (e) {
        return next (new HttpError(err.message, 402));
    }
}