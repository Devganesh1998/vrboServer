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
  let propFeatures = req.query.propFeatures;
  let locationtype = req.query.locationtype;
  let neighbourhoods = req.query.neighbourhoods;
  let bookOptions = req.query.bookOptions;
  
  let locationJoin = "";
  let featureJoin = "";
  let neighbourJoin = "";
  let bookOptionJoin = "";
  let query = ``;
  let whereClause = '';

  if (pageNum != undefined && pageNum > 0) {
    pageNum = (pageNum - 1) * 20;
  } else {
    pageNum = 0;
  }

  if (rating === undefined) {
    rating = [1, 2, 3, 4, 5];
  } else {
    rating = rating.split(",");
  }

  if (category === undefined) {
    category = ["Apartment", "House", "Villa", "Cottage", "test"];
  } else {
    category = category.split(",");
  }

  if (locationtype != undefined) {
    locationJoin =
      "JOIN prop_locations ON prop_locations.propId = properties.id";
    locationtype = locationtype.split(",");
    locationtype.forEach(
      (location) => (whereClause += ` AND prop_locations.${location} = true`)
    );  
  }

  if (propFeatures != undefined) {
    featureJoin = "JOIN prop_features ON properties.id = prop_features.propId";
    propFeatures = propFeatures.split(",");
    propFeatures.forEach(
      (feature) => (whereClause += ` AND prop_features.${feature} = true`)
    );
  }

  if (bookOptions != undefined) {
    bookOptionJoin =
      "JOIN prop_bookopts ON prop_bookopts.propId = properties.id";
    bookOptions = bookOptions.split(",");
    bookOptions.forEach(
      (bookopt) => (whereClause += ` AND prop_bookopts.${bookopt} = true`)
    );
  }

  if (neighbourhoods != undefined) {
    neighbourJoin =
      "JOIN prop_neighbourhoods ON prop_neighbourhoods.propId = properties.id";
    neighbourhoods = neighbourhoods.split(",");
    neighbourhoods.forEach(
      (neighbourhood) =>
        (whereClause += ` AND prop_neighbourhoods.${neighbourhood} = true`)
    );
  }

  query = `SELECT * from properties ${featureJoin} ${locationJoin} ${neighbourJoin} ${bookOptionJoin} WHERE properties.rating IN (:rating) AND properties.category IN (:category) `;
  query += whereClause;

  db.sequelize
    .query(
      `SELECT COUNT(*) AS propCount FROM properties ${featureJoin} ${locationJoin} ${neighbourJoin} ${bookOptionJoin} WHERE properties.rating IN (:rating) AND properties.category IN (:category)`,
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
        `${query} LIMIT :offset, 20`,
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
});

// http://localhost:3000/listing?rating=1,2,3&category=House&locationtype=Oceanfront,Beachfront,Beach,Beachview&neighbourhoods=OceanLakes,MyrtleBeachResort,KingstonPlantation,OceanCreekResort&bookOption=freeCan,InstantCon&propFeatures=Pool,Kitchen,AirConditioning

router.get("/getTotalPageNum", async (req, res) => {
  try {
    const totalPropertiesCount = await db.properties.count();
    res.send({
      TotalPageNum: totalPropertiesCount / 20,
      totalPropertiesCount: totalPropertiesCount,
    });
  } catch(err) {
    console.log(err);
    res.status(500).json({errmsg: "Internal Server Error"});
  }

});

router.get("/:id", (req, res) => {
  const id = req.params.id;

  db.sequelize
    .query(
      `SELECT * from properties JOIN prop_features ON properties.id = prop_features.propId JOIN prop_locations ON prop_locations.propId = properties.id JOIN prop_neighbourhoods ON prop_neighbourhoods.propId = properties.id JOIN prop_bookopts ON prop_bookopts.propId = properties.id WHERE properties.id = :id`,
      {
        replacements: {
          id: id,
        },
        type: QueryTypes.SELECT,
      }
    )
    .then((result) => res.send(result))
    .catch(err => {
      console.log(err);
      res.status(500).json({errmsg: "Internal Server Error"});
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

// router.post("/addFeatures", async (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     await db.prop_features.create({
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
//       maxGuestCount: prop[i].maxGuestCount,
//       allowPets: prop[i].allowPets,
//       propId: i + 201,
//     });
//   }

//   res.send("done");
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

// router.post("/addbookopt", async (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     await db.prop_bookopts.create({
//       freeCancellation: prop[i].freeCancellation,
//       instantConfirmation: prop[i].instantConfirmation,
//       dayConformation: prop[i].dayConformation,
//       propId: i + 1,
//     });
//   }

//   res.send("done");
// });

module.exports = router;
