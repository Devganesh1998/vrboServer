const router = require("express").Router();

router.use('/properties', require('./property'));
router.use('/razorPay', require('./payment'));
router.use('/sendMail', require('./sendMail'));
router.use('/reviews', require('./review'));
router.use('/userProfiles', require('./userProfile'));

module.exports = router;