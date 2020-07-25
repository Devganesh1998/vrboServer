const router = require("express").Router();

router.use('/properties', require('./property'));

module.exports = router;