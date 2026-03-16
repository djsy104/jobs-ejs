const express = require("express");
require("express-async-errors");
require("dotenv").config(); // to load the .env file into the process.env object
const cookieParser = require("cookie-parser");
const csrf = require("host-csrf");

const app = express();

const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

app.set("trust proxy", 1);

const session = require("express-session");

app.use(helmet());
app.use(xss());
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max of 100 requests per windowMs
  }),
);

// Session handling
const MongoDBStore = require("connect-mongodb-session")(session);
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  sessionParms.cookie.secure = true;
}

app.use(session(sessionParms));

app.use(cookieParser(process.env.SESSION_SECRET));
const csrfMiddleware = csrf.csrf();
app.use(csrfMiddleware);

app.use(require("connect-flash")());

const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  csrf.getToken(req, res);
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

// secret word handling
const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

const jobsRouter = require("./routes/jobs");
app.use("/jobs", auth, jobsRouter);

app.get("/multiply", (req, res) => {
  let result = Number(req.query.first) * Number(req.query.second);

  if (Number.isNaN(result)) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }

  res.json({ result });
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
