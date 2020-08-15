const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const { QueryTypes, Op } = require("sequelize");
const { body, validationResult } = require("express-validator");

const db = require("../models");

router.get("/", (req, res) => {
  const propId = req.query.propId;

  console.log(propId);

  if (propId != undefined && propId != null) {
    db.sequelize
      .query(
        "SELECT * from reviews JOIN user_profiles ON user_profiles.id = reviews.userProfileId WHERE propId = :propId",
        {
          replacements: {
            propId: propId,
          },
          type: QueryTypes.SELECT,
        }
      )
      .then((result) => {
        console.log(result);
        res.send(result);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ errmsg: "Internal Server Error" });
      });
  } else {
    res.send({
      message: "please send property id as a query",
      "sample Format": "api.vrbo.com/reviews?propId=3",
    });
  }
});

router.post("/add", async (req, res) => {
  const rev = req.body.reviews;

  for (let i = 0; i < rev.length; ++i) {
    await db.reviews.create({
      reviewby: rev[i].reviewby,
      ratings: rev[i].ratings,
      review: rev[i].review,
      publishedat: rev[i].publishedat,
      propId: rev[i].propId,
      userProfileId: rev[i].userProfileId,
    });
  }
  res.send("done");
});

module.exports = router;
