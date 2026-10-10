const express = require("express");

const {
  register,
  login,
  googleLogin,
  getMe,
} = require("../controllers/auth.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", authenticate, getMe);

module.exports = router;