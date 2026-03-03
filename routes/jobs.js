const express = require("express");

const router = express.Router();
const {
  getAllJobs,
  showNewJob,
  createJob,
  showEditJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

router.get("/", getAllJobs);
router.post("/", createJob);
router.get("/new", showNewJob);
router.get("/edit/:id", showEditJob);
router.post("/update/:id", updateJob);
router.post("/delete/:id", deleteJob);

module.exports = router;
