const Job = require("../models/Job");
const parseValidationErr = require("../utils/parseValidationErrs");
const csrf = require("host-csrf");

const getAllJobs = async (req, res, next) => {
  csrf.getToken(req, res);

  const {
    user: { _id: userId },
  } = req;

  try {
    const jobs = await Job.find({ createdBy: userId }).sort("createdAt");

    return res.render("jobs", {
      jobs,
      errors: req.flash("error"),
      info: req.flash("info"),
    });
  } catch (e) {
    return next(e);
  }
};

const showNewJob = async (req, res) => {
  csrf.getToken(req, res);

  return res.render("job", {
    job: null,
    errors: req.flash("error"),
  });
};

const createJob = async (req, res, next) => {
  const {
    body: { company, position, status },
    user: { _id: userId },
  } = req;

  try {
    await Job.create({
      company,
      position,
      status,
      createdBy: userId,
    });
  } catch (e) {
    if (e?.name === "ValidationError") {
      parseValidationErr(e, req);
      return res.render("job", {
        job: null,
        errors: req.flash("error"),
      });
    }
    return next(e);
  }

  req.flash("info", "Job created successfully.");
  return res.redirect("/jobs");
};

const showEditJob = async (req, res, next) => {
  csrf.getToken(req, res);

  const {
    user: { _id: userId },
    params: { id: jobId },
  } = req;

  try {
    const job = await Job.findOne({ createdBy: userId, _id: jobId });

    if (!job) {
      req.flash("error", `Unable to find job with id ${jobId}`);
      return res.redirect("/jobs");
    }

    return res.render("job", {
      job,
      errors: req.flash("error"),
    });
  } catch (e) {
    return next(e);
  }
};

const updateJob = async (req, res, next) => {
  const {
    body: { company, position, status },
    user: { _id: userId },
    params: { id: jobId },
  } = req;

  if (company === "" || position === "") {
    req.flash("error", "Company and Position cannot be empty.");
    return res.redirect("/jobs/edit/" + jobId);
  }

  try {
    const job = await Job.findOneAndUpdate(
      { createdBy: userId, _id: jobId },
      { company, position, status },
      { new: true, runValidators: true },
    );

    if (!job) {
      req.flash("error", `Unable to find job with id ${jobId}`);
      return res.redirect("/jobs");
    }
  } catch (e) {
    if (e?.name === "ValidationError") {
      parseValidationErr(e, req);
      return res.redirect("/jobs/edit/" + jobId);
    }
    return next(e);
  }

  req.flash("info", "Job updated successfully.");
  return res.redirect("/jobs");
};

const deleteJob = async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { id: jobId },
  } = req;

  try {
    const job = await Job.findOneAndDelete({ createdBy: userId, _id: jobId });

    if (!job) {
      req.flash("error", `Unable to find job with id ${jobId}`);
      return res.redirect("/jobs");
    }
  } catch (e) {
    return next(e);
  }

  req.flash("info", "Job deleted successfully.");
  return res.redirect("/jobs");
};

module.exports = {
  getAllJobs,
  showNewJob,
  createJob,
  showEditJob,
  updateJob,
  deleteJob,
};
