process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const https = require("https");
const bodyParser = require("body-parser");
app.use(cors());
const session = require("express-session");
const accountRoute = require("./routes/account.r.js");
const authGoogleRoute = require("./routes/auth/auth-google.r.js");
const categoryRoute = require("./routes/category.r")
const productRoute = require("./routes/product.r")
const orderRoute = require('./routes/order.r.js')
const port = process.env.PORT || 5000;
const secret = "My secret";
const searchC = require("./controllers/search.c.js");
const adminRoute = require("./routes/admin.js");

const {ProdStats, AccStats, OrderStats, CatStats} = require('./utils/statistic');

const { createProxyMiddleware } = require('http-proxy-middleware');

// create socket server
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { proc } = require("./utils/db.js");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// environment vairable

const jwtPrimary = process.env.JWT_SECRET_KEY;

// app.use(session({
//     secret: secret,
//     resave: false,
//     saveUninitialized: true,
//     cookie: {secure: false}
// }));
// require('./config/passport-setup.js')(app);
// require("./config/passport-login.js")(app);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});
app.get('/', async (req, res) => {
  const delay = () => {
  setTimeout(()=> {
    return res.json({message : "Chao " + port})
  }, 1000)
  }
  await delay();
})
app.use("/api/account", accountRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/product", productRoute);
app.use("/api/admin", adminRoute);
app.use('/api/order',orderRoute)
app.use("/api/trans", require("./routes/transaction.r.js"));
//app.use("/auth", authGoogleRoute);

app.use("/api/search", searchC.search);
app.use((error, req, res, next) => {
  // Check that Have the res been sent ?
  if (req.headerSent) {
    return next(error);
  }
  // Check the status and set it
  res.status(error.code || 500);
  // Leave the message
  res.json({ message: error.message || "There some errors occured " });
});

const server = http.createServer(app);
// const server = https.createServer({
//     key: fs.readFileSync(path.join(__dirname,'cert','key.pem')),
//     cert: fs.readFileSync(path.join(__dirname,'cert','cert.pem'))
// }, app);




const io = new Server(server, {
  cors: {
    origin: "*",
  },
});


io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    const clientToken = socket.handshake.query.token.split(" ")[1];
    let decodedToken;
    try {
    decodedToken = jwt.verify
    (clientToken , process.env.JWT_SECRET_KEY);
    }
    catch (err) {
      return next(new Error("Authorization failed"))
    }
    if(!decodedToken.userId 
      && !decodedToken.role 
      && decodedToken.role.trim() !== "admin" ){
        return next(new Error("Authorization failed"))
      }
    socket.userData = {
      userId : decodedToken.userId,
      role : decodedToken.role
    }
  }next();
}).on("connection", ( socket) => {

  socket.on("join", ({ name }) => {
    console.log("Someone connected");
  });


  const getAllStats = async (req, res, next) => {
    let prodStat , accStat, catStat, orderStat;
    try {
      prodStat = await ProdStats();
      accStat = await AccStats();
      catStat = await CatStats();
      orderStat = await OrderStats();
      socket.emit("statistic" , {
        accStat, 
        prodStat,
        catStat,
        orderStat
      })
    }
    catch(err) {
      return next (new Error("could not get stat"))
    }
  }

  getAllStats();

  setInterval(async ()=> {
    await getAllStats()
  }, 10*1000)

});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});