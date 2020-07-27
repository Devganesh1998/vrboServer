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
    rating = rating.split(",");
  }

  if (category === undefined) {
    console.log("category", category);
    category = ["Apartment", "House", "Villa", "Cottage"];
  } else {
    category = category.split(",");
  }

  db.properties
    .findAndCountAll({
      attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      offset: pageNum,
      limit: 20,
      where: {
        rating: rating,
        category: category,
      },
    })
    .then((result) => {
      res.send({
        propCount: result.count,
        properties: result.rows,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errormsg: "Internal Server Error" });
    });
});

router.get("/filter", (req, res) => {
  let pageNum = req.query.pageNum;
  let rating = req.query.rating;
  let category = req.query.category;
  let propFeatures = req.query.propFeatures;

  if (pageNum != undefined && pageNum > 0) {
    pageNum = (pageNum - 1) * 20;
  } else {
    pageNum = 0;
  }

  if (rating === undefined) {
    console.log("rating", rating);
    rating = [1, 2, 3, 4, 5];
  } else {
    rating = rating.split(",");
  }

  if (category === undefined) {
    console.log("category", category);
    category = ["Apartment", "House", "Villa", "Cottage"];
  } else {
    category = category.split(",");
  }

  if (propFeatures != undefined) {
    res.send("not yet");
  } else {
    db.sequelize
      .query(
        "SELECT COUNT(*) AS propCount FROM properties WHERE rating IN (:rating) AND category IN (:category) ",
        {
          replacements: {
            rating: rating,
            category: category,
          },
          type: QueryTypes.SELECT,
        }
      )
      .then(async (result) => {
        result = result[0];
        result.properties = await db.sequelize.query(
          "SELECT title, category, sleeps, bedRooms, bathRooms, halfBaths, area, minStay, pricePerNight, totalPrice, rating from Properties WHERE rating IN (:rating) AND category IN (:category) LIMIT :offset, 20",
          {
            replacements: {
              rating: rating,
              category: category,
              offset: pageNum,
            },
            type: QueryTypes.SELECT,
          }
        );
        return result;
      })
      .then((result) => res.send(result))
      .catch((err) => {
        console.log(err);
        res.status(500).json({ errormsg: "Internal Server Error" });
      });
  }
});

// http://localhost:3000/listing?rating=1,2,3&category=House&locationtype=Oceanfront,Beachfront,Beach,Beachview&neighbourhoods=OceanLakes,MyrtleBeachResort,KingstonPlantation,OceanCreekResort&bookOption=freeCan,InstantCon&propFeatures=Pool,Kitchen,AirConditioning

router.get("/getTotalPageNum", async (req, res) => {
  const totalPropertiesCount = await db.properties.count();

  res.send({
    TotalPageNum: totalPropertiesCount / 20,
    totalPropertiesCount: totalPropertiesCount,
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

// router.post("/addFeatures", (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     db.prop_features.create({
//       pool: prop[i].pool,
//       privatepool: prop[i].privatepool,
//       wifi: prop[i].wifi,
//       washer: prop[i].washer,
//       dryer: prop[i].dryer,
//       stove: prop[i].stove,
//       oven: prop[i].oven,
//       air_con: prop[i].air_con,
//       parking: prop[i].parking,
//       tv: prop[i].tv,
//       hot_tub: prop[i].hot_tub,
//       bed_linens: prop[i].bed_linens,
//       outdoor_grill: prop[i].outdoor_grill,
//       dishwasher: prop[i].dishwasher,
//       fire_place: prop[i].fire_place,
//       microwave: prop[i].microwave,
//       propId: i + 1,
//     });
//   }
// });

// router.post("/addlocations", async (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     await db.prop_location.create({
//       Oceanfront: prop[i].Oceanfront,
//       Beachfront: prop[i].Beachfront,
//       Beach: prop[i].Beach,
//       Ocean: prop[i].Ocean,
//       Lake: prop[i].Lake,
//       Mountains: prop[i].Mountains,
//       Downtown: prop[i].Downtown,
//       Village: prop[i].Village,
//       Rural: prop[i].Rural,
//       Ski_in: prop[i].Ski_in,
//       GolfCourse: prop[i].GolfCourse,
//       BeachView: prop[i].BeachView,
//       Waterfront: prop[i].Waterfront,
//       propId: i + 1,
//     });
//   }

//   res.send("done");
// });

// router.post("/addneigh", async (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     await db.prop_neighbourhoods.create({
//       OceanLakes: prop[i].OceanLakes,
//       MyrtleBeachResort: prop[i].MyrtleBeachResort,
//       KingstonPlantation: prop[i].KingstonPlantation,
//       OceanCreekResort: prop[i].OceanCreekResort,
//       propId: i + 1,
//     });
//   }

//   res.send("done");
// });

router.post("/addbookopt", async (req, res) => {
  const prop = req.body.properties;

  for (let i = 0; i < prop.length; ++i) {
    await db.prop_bookopts.create({
      freeCancellation: prop[i].freeCancellation,
      instantConfirmation: prop[i].instantConfirmation,
      dayConformation: prop[i].dayConformation,
      propId: i + 1,
    });
  }

  res.send("done");
});

module.exports = router;
