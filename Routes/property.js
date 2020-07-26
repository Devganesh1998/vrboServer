const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const { QueryTypes, Op } = require("sequelize");
const { body, validationResult } = require("express-validator");

const db = require("../models");

router.get("/", (req, res) => {
  let pageNum = req.query.pageNum;
  let rating = req.query.rating;
  let category = req.query.category;

  console.log(pageNum, rating);

  if (pageNum != undefined && pageNum > 0) {
    pageNum = (pageNum - 1) * 20;
  } else {
    pageNum = 0;
  }

  if (rating === undefined) {
    console.log("rating", rating);
    rating = [1, 2, 3, 4, 5];
  } else {
    rating = rating.split(',');
  }

  if (category === undefined) {
    console.log("category", category);
    category = ['Apartment', 'House', 'Villa', 'Cottage']
  } else {
    category = category.split(',');
  }

  db.properties
    .findAll({
      attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      offset: pageNum,
      limit: 20,
      where: {
        rating: rating,
        category: category
      }
    })
    .then((result) => res.send(result))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errormsg: "Internal Server Error" });
    });
});


router.get('/getTotalPageNum', async (req, res) => {
  const totalPropertiesCount = await db.properties.count();

  res.send({
    TotalPageNum: totalPropertiesCount / 20,
    totalPropertiesCount: totalPropertiesCount
  })
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
