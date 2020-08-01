const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const { QueryTypes, Op } = require("sequelize");
const { body, validationResult } = require("express-validator");

const db = require("../models");

router.get("/", (req, res) => {});

router.post("/add", async (req, res) => {
  const rev = req.body.users;

  for (let i = 0; i < rev.length; ++i) {
    await db.user_profiles.create({
      firstName: rev[i].firstName,
      lastName: rev[i].lastName,
      email: rev[i].email,
      profileImgSrc: rev[i].profileImgSrc,
      phone: rev[i].phone,
    });
  }
  res.send("done");
});

module.exports = router;
