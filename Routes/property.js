const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const { QueryTypes } = require("sequelize");
const { body, validationResult } = require("express-validator");

const db = require("../models");

router.get("/", (req, res) => {
  let pageNum = req.query.pageNum;

  console.log(pageNum);

  if (pageNum != undefined && pageNum > 0) {
    pageNum = (pageNum - 1) * 50;
  } else {
    pageNum = 0;
  }

  db.properties
    .findAll({
      attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      offset: pageNum,
      limit: 50,
    })
    .then((result) => res.send(result))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errormsg: "Internal Server Error" });
    });
});

// router.post('/add', (req, res) => {
//     const prop = req.body.properties;

//     const cat = ["test", "House", "Apartment", "Villa", "Cottage"];

//     for (let i = 0; i < prop.length; ++i) {
//         db.properties.create({
//             title: prop[i].title,
//             category: cat[i % 5],
//             sleeps: prop[i].sleeps,
//             bedRooms: prop[i].bedRooms,
//             bathRooms: prop[i].bathRooms,
//             halfBaths: prop[i].halfBaths,
//             area: prop[i].area,
//             minStay: prop[i].minStay,
//             pricePerNight: prop[i].pricePerNight,
//             totalPrice: prop[i].totalPrice,
//             rating: prop[i].rating,
//         });
//     }
// });

module.exports = router;
