const accGoogleModel = require("../../models/acc-google.m");
const accM = require("../../models/acc.m");
const HttpError = require("../../models/http-error");
const jwt = require("jsonwebtoken");
const jwtKey = process.env.JWT_SECRET_KEY;

module.exports = {
    getUserById: async (req, res, next) => {
        const id = req.params.id;
        let identifierUser;
        try {
            identifierUser = await accM.getByUserID(id);
        }
        catch (err) {
            console.error(err)
            return next(new HttpError("Some error when find user google by id"), 500)
        }
        if (!identifierUser)
            return next(new HttpError("Can not find use with provide id: " + id, 404));
        //console.log("identifierUser in  getUserById gg acc", identifierUser);
        return res.status(200).json({ user: identifierUser });
    },

    loginWithGoogle: async (req, res, next) => {
        // check the sub == username column
        const id = req.params.id;
        console.log("sub in acc Google controller login wG function", id);
        let identifierUser;
        try {
            identifierUser = await accM.getByUsername(id);
        }
        catch (err) {
            console.error(err)
            return next(new HttpError("Some error when find user google by id"), 500)
        }

        if (!identifierUser)
            return res.status(200).json({ existed: false })
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
            const error = new HttpError(
                'Something wrong when add jwt', 500
            );
            return next(error);
        }

        res.status(201).json({
            existed: true,
            message: "Login success",
            user: {
                id: identifierUser.ID,
                username: identifierUser.username,
                email: identifierUser.Email,
                role: identifierUser.Role,
                permission: identifierUser.permission,
                token: token
            },
        });
    }
    ,

    register: async (req, res, next) => {
        const username = req.body.username;
        console.log("enter google register", username);
        const acc = await accM.getByUsername(username);
        const { name, email, dob, role } = req.body;

        if (acc) {
            console.log(`This user login with username aka sub:'${username}' has been existed`);
            console.log('exit')
            const error = new HttpError(
                `This user login with Google sub:'${id}' has been existed`,
                450
            );
            return next(error);
        }

        if (!name || !email || !dob || !role) {
            const error = new HttpError(`You have to fill out all the fields `, 450);
            return next(error);
        }

        let newUser;
        let token;
        try {
            newUser = await accM.add(
                new accM({
                    Name: name,
                    Username: username,
                    Email: email,
                    Password: null,
                    DOB: dob,
                    Role: role,
                    Permission: 1
                })
            );
            //console.log("newUser in Google register", newUser);
        } catch (err) {
            console.error(err)
            const error = new HttpError("Something wrong when register new user with Google", 500);
            return next(error);
        }

        // adding token
        try {
            token = jwt.sign(
                {
                    userId: newUser.ID,
                    username: newUser.username,
                    role
                },
                process.env.JWT_SECRET_KEY,
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
            message: "Register new account with Google successfully",
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
    update: async (req, res, next) => {
        console.log("enter update user google handler");
        console.log("userID token", req.userData.userId);
        const userID = req.userData.userId;
        console.log("update function userid from req: ", userID);
        const acc = await accM.getByUserID(userID);
        if (!acc) {
            res.json({ message: "Invalid user" });
        } else {
            const newUsername = req.body.newUsername ? req.body.newUsername : null;
            const newName = req.body.newName ? req.body.newName : null;
            const newEmail = req.body.newEmail ? req.body.newEmail : null;
            const newDOB = req.body.newDOB ? req.body.newDOB : null;
            if (!newName && !newDOB) {
                next(new HttpError("You have to provide at least one new information to update"));
            }

            const newValues = {
                user_id: userID,
                newUsername,
                newPassword: null,
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
}