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
  let whereClause = "";

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

  query = `SELECT * from properties JOIN prop_geos ON properties.id = prop_geos.propId ${featureJoin} ${locationJoin} ${neighbourJoin} ${bookOptionJoin} WHERE properties.rating IN (:rating) AND properties.category IN (:category) `;
  query += whereClause;

  db.sequelize
    .query(
      `SELECT COUNT(*) AS propCount FROM properties ${featureJoin} ${locationJoin} ${neighbourJoin} ${bookOptionJoin} WHERE properties.rating IN (:rating) AND properties.category IN (:category) ${whereClause}`,
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
        `${query} LIMIT :offset, 20;`,
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
  } catch (err) {
    console.log(err);
    res.status(500).json({ errmsg: "Internal Server Error" });
  }
});

router.get('/getTotalCost', (req, res) => {
  const arrivalDate = req.query.arrivalDate;
  const destinationDate = req.query.destinationDate;
  const adultsCount = req.query.adultsCount;
  const childrenCount = req.query.childrenCount;
  const propId = req.query.propId;

  const startDate = new Date(arrivalDate);
  const endDate = new Date(destinationDate);

  const timeDiff = endDate.getTime() - startDate.getTime();
  console.log("Difference_In_Days>>>>>>>>>>>>>>", startDate, endDate);

  const Difference_In_Days = timeDiff / (1000 * 3600 * 24); 


  db.sequelize.query('SELECT pricePerNight from properties WHERE id = :propId', {
    replacements: {
      propId: propId
    },
    type: QueryTypes.SELECT
  }).then(result => {
    const price = Number(result[0].pricePerNight);
    console.log(price);
    let total = ((Number(adultsCount) + Number(childrenCount)) / 3) * price;
    total = Difference_In_Days * price;
    console.log("total>>>>>>>>>>>>>>>>>>>>>>", total);
    res.send({totalPrice: total});
  }).catch(err => {
    console.log(err);
    res.status(500).json({errmsg: "Internal Server Error"});
  })
});

router.get("/:id", (req, res) => {
  const id = req.params.id;

  db.sequelize
    .query(
      `SELECT * from properties JOIN prop_geos ON properties.id = prop_geos.propId JOIN prop_neighbourhoods ON prop_neighbourhoods.propId = properties.id JOIN prop_bookopts ON prop_bookopts.propId = properties.id WHERE properties.id = :id`,
      {
        replacements: {
          id: id,
        },
        type: QueryTypes.SELECT,
      }
    )
    .then(async (result) => {
      const features = await db.sequelize.query(
        "SELECT * from prop_features WHERE propId = :propId",
        {
          replacements: {
            propId: id,
          },
          type: QueryTypes.SELECT,
        }
      );
      const res_features = [];
      Object.keys(features[0]).forEach((key) => {
        if (
          key != "id" &&
          key != "propId" &&
          key != "createdAt" &&
          key != "updatedAt" &&
          key != "maxGuestCount"
        ) {
          if (features[0][key]) {
            res_features.push(key);
          }
        }
      });
      result = result[0];
      result.features = res_features;
      return result;
    })
    .then(async (result) => {
      const locations = await db.sequelize.query(
        "SELECT * from prop_locations WHERE propId = :propId",
        {
          replacements: {
            propId: id,
          },
          type: QueryTypes.SELECT,
        }
      );
      const res_locations = [];
      Object.keys(locations[0]).forEach((key) => {
        if (
          key != "id" &&
          key != "propId" &&
          key != "createdAt" &&
          key != "updatedAt"
        ) {
          if (locations[0][key]) {
            res_locations.push(key);
          }
        }
      });
      result.locations = res_locations;
      return result;
    })
    .then(async (result) => {
      const genFeatures = await db.sequelize.query(
        "SELECT * from prop_gen_features WHERE propId = :propId",
        {
          replacements: {
            propId: id,
          },
          type: QueryTypes.SELECT,
        }
      );
      const res_genFeatures = [];
      console.log(genFeatures);
      Object.keys(genFeatures[0]).forEach((key) => {
        if (
          key != "id" &&
          key != "propId" &&
          key != "createdAt" &&
          key != "updatedAt"
        ) {
          if (genFeatures[0][key]) {
            res_genFeatures.push(key);
          }
        }
      });
      result.genFeatures = res_genFeatures;
      console.log(result);
      return result;
    })
    .then((result) => {
      result.bookedDates = [{startDate: "08/02/2020", endDate: "08/09/2020"}]
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errmsg: "Internal Server Error" });
    });
});


router.post("/addGeo", async (req, res) => {
  const prop = req.body.properties;

  const img = [
    "https://odis.homeaway.com/odis/listing/e4559c88-6cd7-4306-88dd-29c4f64909ae.f10.jpg",
    "https://odis.homeaway.com/odis/listing/ef5a6b91-6c7a-4012-a4be-e56390bb59a4.f10.jpg",
    "https://odis.homeaway.com/odis/listing/b7ed0e08-29a2-498c-a700-ec446ad75e27.f10.jpg",
    "https://odis.homeaway.com/odis/destination/5941b1e0-2600-4b2a-b27e-c667abf7e510.carousel-m.jpg",
    "https://odis.homeaway.com/odis/destination/adf45333-140a-40cf-987f-bc49b711c3d9.carousel-m.jpg",
    "https://odis.homeaway.com/odis/destination/397eabda-51d4-45d4-82c8-da3ad409ff84.carousel-m.jpg",
    "https://odis.homeaway.com/odis/listing/aa2f8623-a207-4980-881c-6af5310d73cf.f10.jpg",
    "https://odis.homeaway.com/odis/listing/7e8764b2-8fa5-4ba7-8722-2442a2733f94.f10.jpg",
    "https://odis.homeaway.com/odis/listing/531a953a-3693-4882-9f2a-c1cd709a3aab.f10.jpg",
    "https://odis.homeaway.com/odis/listing/c3b29a23-e507-46e0-8318-4cdbdef67673.f10.jpg",
    "https://odis.homeaway.com/odis/listing/10a2ed33-55db-45a5-93d7-560f6517a48a.f10.jpg",
    "https://media.vrbo.com/lodging/34000000/33970000/33961500/33961403/ba98a91f.f10.jpg",
    "https://media.vrbo.com/lodging/34000000/33970000/33961500/33961403/ba98a91f.f10.jpg",
    "https://media.vrbo.com/lodging/34000000/33970000/33961500/33961403/fd6c4fa0.f10.jpg",
    "https://media.vrbo.com/lodging/34000000/33970000/33961500/33961403/c24bcb3f.f10.jpg",
    "https://odis.homeaway.com/odis/listing/a5a64026-8a43-4d75-a143-94a51a775783.f10.jpg",
    "https://odis.homeaway.com/odis/listing/2d14f3d2-d1aa-4ee3-ad61-686d3c2c3fd6.f10.jpg",
    "https://odis.homeaway.com/odis/listing/00dff347-69a4-4049-8584-c46f2a113d7f.f10.jpg"
  ];
  
  const geoLocations = [
    {
      lat: 8.8932,
      long: 76.6141
    },
    {
      lat: 10.5276,
      long: 76.2144
    },
    {
      lat: 11.8745,
      long:  75.3704
    },
    {
      lat: 9.4981,
      long: 76.3388
    },
    {
      lat: 9.5916,
      long: 76.5222
    },
    {
      lat: 10.7867,
      long: 76.6548
    },
    {
      lat: 11.0510,
      long: 76.0711
    },
    {
      lat: 11.1203,
      long: 76.1199
    },
    {
      lat: 10.2277,
      long: 76.1971
    },
    {
      lat: 11.7491,
      long: 75.4890
    },
    {
      lat: 9.9487,
      long: 76.3464
    },
    {
      lat: 10.7677,
      long: 75.9259
    },
    {
      lat: 10.0327,
      long: 76.3319
    },
    {
      lat: 11.6016,
      long: 75.5920
    },
    {
      lat: 12.3311,
      long: 75.0915
    },
    {
      lat: 12.0351,
      long: 75.3611
    },
    {
      lat: 11.4429,
      long: 75.6976
    },
    {
      lat: 11.0540,
      long: 75.8555
    },
    {
      lat: 8.4027,
      long: 77.0861
    },
    {
      lat: 10.0531,
      long: 76.3528
    },
    {
      lat: 11.1736,
      long: 75.8040
    },
    {
      lat: 11.6016,
      long: 75.5920
    },
    {
      lat: 9.931233,
      long: 76.267303
    },
    {
      lat: 8.5241,
      long: 76.9366
    },
    {
      lat: 10.5276,
      long: 76.2144
    },
  ];

  for (let i = 0; i < prop.length; ++i) {
    await db.prop_geos.create({
      description: prop[i].description,
      latitude: geoLocations[i % geoLocations.length].lat,
      longitude: geoLocations[i % geoLocations.length].long,
      imgsrc: img[i % img.length],
      propId: i + 484 + 1,
    });
  }

  res.send("done");
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

// router.post("/addgenFeatures", async (req, res) => {
//   const prop = req.body.properties;

//   for (let i = 0; i < prop.length; ++i) {
//     await db.prop_gen_features.create({
//       Telephone: prop[i].Telephone,
//       'Air Conditioning': prop[i]['Air Conditioning'],
//       Heating: prop[i].Heating,
//       'Lines Provided': prop[i]['Lines Provided'],
//       "Washing Machine": prop[i]["Washing Machine"],
//       "Clothes Dryer": prop[i]["Clothes Dryer"],
//       Parking: prop[i].Parking,
//       "Towels Provided": prop[i]["Towels Provided"],
//       "FitnessRoom/ Equipment": prop[i]["FitnessRoom/ Equipment"],
//       "Iron & Board": prop[i]["Iron & Board"],
//       "Hair Dryer": prop[i]["Hair Dryer"],
//       Elevator: prop[i].Elevator,
//       "Living Room": prop[i]["Living Room"],
//       "Bed linens provided": prop[i]["Bed linens provided"],
//       "Iron and board": prop[i]["Iron and board"],
//       Crib: prop[i].Crib,
//       'Kids high chair': prop[i]['Kids high chair'],
//       propId: prop[i].propId,
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
