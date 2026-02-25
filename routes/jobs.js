const express = require("express");

const router = express.Router();

router.route("/jobs").get().post();
router.route("/jobs/new").get();
router.route("/jobs/edit/:id").get();
router.route("/jobs/update/:id").post();
router.route("/jobs/delete/:id").post();
