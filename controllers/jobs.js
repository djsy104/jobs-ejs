const Job = require("../models/Job");
const parseVErr = require("../utils/parseValidationErrs");
const csrf = require("host-csrf");

const getAllJobs = async (req, res, next) => {
  csrf.getToken(req, res);

  let jobs;
  try {
    jobs = await Job.find({ createdBy: req.user._id });
  } catch (e) {
    return next(e);
  }

  res.render("jobs", {
    jobs: jobs,
    errors: req.flash("error"),
    info: req.flash("info"),
  });
};

const showNewJob = (req, res) => {
  csrf.getToken(req, res);

  res.render("job", {
    job: null,
    errors: req.flash("error"),
  });
};

const createJob = async (req, res, next) => {
  try {
    await Job.create({
      company: req.body.company,
      position: req.body.position,
      status: req.body.status,
      salary: req.body.salary,
      dateApplied: req.body.dateApplied,
      remote: req.body.remote,
      skills: req.body.skills,
      createdBy: req.user._id,
    });
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
      return res.render("job", {
        job: null,
        errors: req.flash("error"),
      });
    } else {
      return next(e);
    }
  }

  req.flash("info", "Job created successfully.");
  res.redirect("/jobs");
};

const showEditJob = async (req, res, next) => {
  csrf.getToken(req, res);

  let job;
  try {
    job = await Job.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
  } catch (e) {
    return next(e);
  }

  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  res.render("job", {
    job: job,
    errors: req.flash("error"),
  });
};

const updateJob = async (req, res, next) => {
  let job;
  try {
    job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      },
      {
        company: req.body.company,
        position: req.body.position,
        status: req.body.status,
        salary: req.body.salary,
        dateApplied: req.body.dateApplied,
        remote: req.body.remote,
        skills: req.body.skills,
      },
      { runValidators: true },
    );
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
      return res.redirect("/jobs/edit/" + req.params.id);
    } else {
      return next(e);
    }
  }

  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  req.flash("info", "Job updated successfully.");
  res.redirect("/jobs");
};

const deleteJob = async (req, res, next) => {
  let job;
  try {
    job = await Job.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });
  } catch (e) {
    return next(e);
  }

  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  req.flash("info", "Job deleted successfully.");
  res.redirect("/jobs");
};

module.exports = {
  getAllJobs,
  showNewJob,
  createJob,
  showEditJob,
  updateJob,
  deleteJob,
};
