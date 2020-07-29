require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

const PORT = process.env.PORT || 3000;

const db = require("./models");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/info', (req, res) => {
  res.send("Welcome to Vrbo Server");
});

const apiRoutes = require("./Routes");
app.use("/", apiRoutes);

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`listening on: http://localhost:${PORT}`);
  });
});
