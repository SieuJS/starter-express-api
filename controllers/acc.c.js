require('dotenv').config()
const accM = require("../models/acc.m");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRound = 10;
const HttpError = require("../models/http-error");
const {validationResult} = require('express-validator')

// Quy uoc loi input tu client la 420
const jwtKey = process.env.JWT_SECRET_KEY;

const urlServer = process.env.SERVER_URL
module.exports = {
  getUserById: async (req, res, next) => {
    const { userId } = req.params;
    let identifierUser;
    try {
      identifierUser = await accM.getByUserID(userId);
    }
    catch (err) {
      console.error(err)
      return next(new HttpError("Some error when find user"), 500)
    }
    //console.log("identifier get By Id", identifierUser);
    if (!identifierUser)
      return next(new HttpError("Can not find use with provide id: " + userId, 404));
    return res.status(200).json({ user: identifierUser });
  },

  checkUsername: async (req, res, next) => {
    const { username } = req.params;
    let identifierUser;
    try {
      identifierUser = await accM.getByUsername(username);
    }
    catch (err) {
      console.error(err)
      return next(new HttpError("Some error when find user"), 500)
    }
    if (!identifierUser)
      return res.json({ valid: false });
    return res.status(200).json({ user: identifierUser, valid: true });
  },


  signUpHandler: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Your input is not valid", 422));
    }
    const un = req.body.username;

    const acc = await accM.getByUsername(un);
    const { name, email, password, dob, role } = req.body;

    if (acc) {
      console.log(`This username '${acc.Username}' has been existed`);
      console.log('exit')
      const error = new HttpError(

        `This username '${acc.Username}' has been existed`,
        420
      );
      return next(error);
    }

    if (!name || !email || !password || !dob || !role) {
      const error = new HttpError(`You have to fill out all the fields `, 420);
      return next(error);
    }

    let newUser;
    let token;
    try {
      const hashedPw = await bcrypt.hash(password, saltRound);

      newUser = await accM.add(
        new accM({
          Name: name,
          Username: un,
          Email: email,
          Password: hashedPw,
          DOB: dob,
          Role: role,
          Permission: 1 // default when create a new user
        })
      );
    } catch (err) {
      console.error(err)
      const error = new HttpError("Something wrong when signup", 500);
      return next(error);
    }
    // adding token
    console.log(newUser.ID)
    try {
      token = jwt.sign(
        {
          userId: newUser.ID,
          username: newUser.Username,
          role
        },
        jwtKey,
        { expiresIn: "1h" }
      );
    } catch (err) {
      console.error(err)
      const error = new HttpError(
        'Something wrong when add jwt', 500
      );
      return next(error);
    }

    let secondToken;
    try {
      secondToken = jwt.sign({
        message: "Creat customr"
      },
        process.env.JWT_SECOND,
        { expiresIn: "1h" }
      )
    } catch (err) {
      const error = new HttpError(
        'Something wrong when add jwt', 505
      );
      return next(error);
    }

    let fetchRes;
    try {
      fetchRes = await fetch(process.env.PAYMENT_SERVER_HOST + "/api/account/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secondToken}`
        },
        body: JSON.stringify({
          shopId: newUser.ID,
          balance: 3000000
        })
      })

    }
    catch (err) {
      console.log(err)
      const error = new HttpError(
        'Something wrong when create ', 505
      );
      return next(error);
    }

    if (!fetchRes.ok) {
      const error = new HttpError(
        'Something wrong when create ', 505
      );
      return next(error);
    }

    res.status(201).json({
      message: "Register new account successfully",
      user: {
        id: newUser.ID,
        name: newUser.Name,
        username: newUser.Username,
        email: newUser.Email,
        token: token,
        role: newUser.Role,
        permission: newUser.Permission
      },
    });
  },

  logInHandler: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Your input is not valid", 422));
    }
    const { username, password } = req.body;
    let identifierUser
    console.log("get in login")
    try {
      identifierUser = await accM.getByUsername(username);
      
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
  },

  // this function is used for updating the basic info of users by their own
  // not by admin
  // update permisson will use another function
  updateHandler: async (req, res, next) => {
    console.log("enter update user handler");
    console.log("userID token", req.userData.userId);
    const userID = req.userData.userId;
    console.log("update function userid from req: ", userID);
    const acc = await accM.getByUserID(userID);
    if (!acc) {
      res.json({ message: "Invalid user" });
    } else {
      const newUsername = req.body.newUsername ? req.body.newUsername : null;
      const newPw = req.body.newPassword ? req.body.newPassword : null;
      const newName = req.body.newName ? req.body.newName : null;
      const newEmail = req.body.newEmail ? req.body.newEmail : null;
      const newDOB = req.body.newDOB ? req.body.newDOB : null;
      if (!newUsername && !newPw && !newName && !newEmail && !newDOB) {
        return res.json({
          message: "You have to provide at least one new information to update",
        });
      }

      const newValues = {
        user_id: userID,
        newUsername,
        newPassword: newPw ? await bcrypt.hash(newPw, saltRound) : null,
        newName,
        newEmail,
        newDOB
      };
      //console.log(newValues);
      const result = await accM.updateUser(newValues);
      //console.log("result", result);

      if (result) {
        res.json({
          message: "Update user succesfully",
          user: result[0],
        });
      } else {
        res.json({
          message: "Fail to update user",
        });
      }
    }
  },

  deleteHandler: async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({
        isSuccess: false,
        message: "Invalid field username or password or both of them",
      });
    }

    const acc = await accM.getByUsername(username);
    if (!acc) {
      return res.json({
        isSuccess: false,
        message: "The user does not exist",
      });
    } else {
      let checkPw = false;
      checkPw = await bcrypt.compare(password, acc.Password);
      if (checkPw) {
        await accM.deleteUser(username);
        res.json({
          isSuccess: true,
          message: `The user '${username}' has been deleted`,
        });
      } else {
        res.json({
          isSuccess: false,
          message: "Fail to delete the user. The password is incorrect",
        });
      }
    }
  },
  getList: async (req, res, next) => {
    let data;
    let { limit, start } = req.query;
    [limit, start] = [limit ? parseInt(limit) : 5, start ? parseInt(start) : 1]
    try {
      data = await accM.getList(limit, start);
    }
    catch (err) {
      console.error(err);
      return next(new HttpError("Some errors occurs", 500));
    }
    const total = data.totalPage
    res.json({
      start,
      limit,
      ...data,
      next: start === total ? null : `${urlServer}/api/admin/list/page?limit=${limit}&start=${start + 1}`,
      prev: start === '1' ? null : `${urlServer}/api/admin/list/page?limit=${limit}&start=${start - 1}`
    })
  },
  lockAcc: async (req, res, next) => {
    const { userId } = req.params;
    let identifierUser;
    try {
      identifierUser = accM.getByUserID(userId);
    }
    catch (err) {
      console.error(err);
      return next(new HttpError("Some error occurs when find user", 500));
    }
    if (!identifierUser) {
      return next(new HttpError("Can not find use", 404));
    }

    if (identifierUser.Role === "admin") {
      return next(new HttpError("Can not lock Admin acc", 420));
    }
    if (identifierUser.Role === "locked") {
      return next(new HttpError("This account has been locked", 420));
    }
    try {
      accM.lockUser(userId);
    }
    catch {
      return next(new HttpError("Cannot lock", 420));
    }
    return res.json({ message: "Lock success" })
  },
  checkPassword: async (req, res, next) => {
    const userId = req.userData.userId;
    const password = req.body.password;
    console.log("user id in check password func", userId);
    const acc = await accM.getByUserID(userId);
    if (!acc) {
      next(new HttpError("Invalid user ID. Cannot check password"));
      return;
    }

    const match = await bcrypt.compare(password, acc.Password);
    res.json({ match: match });
  },
  getOrders: async (req, res, next) => {
    const userId = req.userData.userId;
    console.log("user id in get orders func", userId);

  },

  // ducthinh update
  banAcc: async (req, res, next) => {
    try {
      const userId = req.body.userId;
      const permission = req.body.permission
      const result = await accM.updatePermission(userId, permission);
      res.json({
        isSuccess: true,
      });
    } catch (error) {
      console.error(err);
      return next(new HttpError("Some errors occurs", 500));
    }

  },
  getBalance: async (req, res, next) => {
    const userId = req.params.userId;
    //console.log("user id in get balance", userId);
    let tokenToPaymentServer;
    try {
      tokenToPaymentServer = jwt.sign({
        userId: userId
      },
        process.env.JWT_SECOND,
        { expiresIn: "1h" }
      )
    } catch (err) {
      const error = new HttpError(
        'Something wrong when add jwt', 505
      );
      return next(error);
    }

    let fetchBalance;
    try {
      fetchBalance = await fetch(process.env.PAYMENT_SERVER_HOST + `/api/account/get-balance/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenToPaymentServer}`
        },
      })
    }
    catch (err) {
      console.log("err in getBalance controller", err);
      return next(new HttpError('Something wrong when create ', 505));
    }

    if (fetchBalance.ok) {
      const result = await fetchBalance.json();
      res.json(result);
    }
  },

  signUpAdminHandler: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError("Your input is not valid", 422));
    }
    const {accountName, accountUser, accountDOB, accountEmail, accountPass} = req.body    
    // const acc = await accM.getByUsername(accountUser);

    // if (acc) {
    //   console.log(`This username '${acc.Username}' has been existed`);
    //   console.log('exit')
    //   const error = new HttpError(
    //     `This username '${acc.Username}' has been existed`,
    //     420
    //   );
    //   return next(error);
    // }

    let newUser;
    try {
      const hashedPw = await bcrypt.hash(accountPass, saltRound);

      newUser = await accM.add(
        new accM({
          Name: accountName,
          Username: accountUser,
          Email: accountEmail,
          Password: hashedPw,
          DOB: accountDOB,
          Role: 'admin',
          Permission: 1 // default when create a new user
        })
      );
    } catch (err) {
      console.error(err)
      const error = new HttpError("Something wrong when signup", 500);
      return next(error);
    }
    res.status(201).json({
      message: "Register new account successfully",
      user: {
        id: newUser.ID,
        name: newUser.Name,
        username: newUser.Username,
        email: newUser.Email,
        role : newUser.Role,
        permission: newUser.Permission
      },
    });
  },

  updateAdminHandler: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new HttpError("Your input is not valid", 422));
      }
      const { userId, Name, Email, DOB } = req.body;
      const newValues = {
        userId,
        newUsername: null,
        newPassword: null,
        Name,
        Email,
        DOB
      };
      const result = await accM.updateUser(newValues);
      if (result) {
        res.json({
          message: "Update user succesfully",
          user: result[0],
        });
      } else {
        res.json({
          message: "Fail to update user",
        });
      }

    } catch (error) {
      console.error(error);
      return next(new HttpError ("Some errors occurs", 500));
    }    
    
  },

};
