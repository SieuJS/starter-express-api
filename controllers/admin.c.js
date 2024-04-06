const paymentKey = process.env.JWT_SECOND;
const AccM = require("../models/acc.m");
const HttpError = require('../models/http-error')
const paymentUrl = process.env.PAYMENT_SERVER_HOST;
const bcrypt = require('bcrypt');
const {validationResult} = require('express-validator')
const saltRound = 10;
const jwt = require('jsonwebtoken')
const checkAuth = require('../middlewares/check-auth')
const checkRole= require('../middlewares/check-role');
const AccC = require('../controllers/acc.c')
const jwtKey = process.env.JWT_SECRET_KEY;
const getToken = () => {
  let token;
  try {
    token = jwt.sign(
      {
        message: "Main server",
      },
      paymentKey,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
  return token;
};

const getTransByPage = async (req, res, next) => {
  const page = req.query.page || 1;
  const userID = parseInt(req.query.userID) || undefined;
  let response ;
  let paymentToken = getToken();
  try {
    response =await fetch(`${paymentUrl}/api/trans/get-by-page?${userID?`userID=${userID}&` :""}page=${page}`, 
    {
        method : "GET",
        headers : {
            Authorization : `bearer ${paymentToken}`
        }
    })
  }
  catch (err) {
    console.log("No crash")
    return next (new HttpError("Can not connect to get your data"));
  }
  
  if(!response.ok){
    return next (new HttpError("Could not get data"));
  }
  else 
  {
  const data = await response.json();
  return res.json(data)
  }
};

const changePassword = async (req, res, next ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Your input is not valid", 422));
    }

    const {newPassword, oldPassword} = req.body
    let AdminId = req.userData.userId ;
    let idetifierAdmin ;
    try {
        idetifierAdmin = await AccM.getByUserID(AdminId)
    }
    catch (err) {
        console.log(err)
        console.error(err);
        return next (new HttpError("Some error occurs", 500));
    }
    if(!idetifierAdmin)
    {
        return next (new HttpError("Not exists Admin", 404));
    }
    let match;
    if(idetifierAdmin.Password){
        match = await bcrypt.compare(oldPassword.trim(), idetifierAdmin.Password)
    }
    if(!match) {
        return next (new HttpError ("Wrong password", 420))
    }
    const hashedPw = await bcrypt.hash(newPassword, saltRound)
    try {
    AccM.updateUser({Id : req.userData.userId,username : null,Password : hashedPw})
    }
    catch (err) {
        console.error(err)
        return next(new HttpError("Some error occurr when change password",500));
    }
    return res.json({message : "Password Changed"})
}

const signInHandler = async (req ,res, next) => {
  const { username, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Your input is not valid", 422));
  }
    let identifierUser
    try {
      identifierUser = await AccM.getByUsername(username);
    } catch (err) {
      console.error(err)
      return next(new HttpError("Some error occurs when find your account", 500));
    }
    if (!identifierUser) {
      const error = new HttpError(`The username '${username}' does not exist`, 404);
      return next(error);
    }

    const check = await bcrypt.compare(password, identifierUser.Password);

    if (!check) {
      const error = new HttpError("Incorrect password", 420);
      return next(error);
    }

    if (identifierUser.Permission == 0) {
      const error = new HttpError("Account has been banned", 500);
      return next(error);
    }
    
    if(identifierUser.Role.trim() !== "admin"){
      const error = new HttpError ("You are not admin", 420);
      return next (error)
    }

    try {
      token = jwt.sign(
        {
          userId: identifierUser.ID,
          username: identifierUser.Username,
          role: identifierUser.Role
        },
        jwtKey,
        { expiresIn: "1h" }
      );
    } catch (err) {
      console.err(err)
      const error = new HttpError(
        'Something wrong when add jwt', 500
      );
      return next(error);
    }

    res.status(201).json({
      message: "Login success",
      user: {
        id: identifierUser.ID,
        name: identifierUser.Name,
        username: identifierUser.Username,
        email: identifierUser.Email,
        role: identifierUser.Role,
        permission: identifierUser.Permission,
        token: token
      },
    });
}

module.exports ={ getTransByPage , changePassword, signInHandler};