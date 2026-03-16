const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const Job = require("../models/Job");

let testUser = null;
let page = null;
let browser = null;

describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  after(async function () {
    this.timeout(5000);
    if (browser) {
      await browser.close();
    }
  });

  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });

  describe("index page test", function () {
    this.timeout(10000);

    it("finds the index page logon link", async function () {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Click this link to logon)",
      );
    });

    it("gets to the logon page", async function () {
      await this.logonLink.click();
      await page.waitForNavigation();
      await page.waitForSelector('input[name="email"]');
    });
  });

  describe("logon page test", function () {
    this.timeout(20000);

    it("resolves all the fields", async function () {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });

    it("sends the logon", async function () {
      testUser = await seed_db();

      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();

      await page.waitForNavigation();

      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector('a[href="/secretWord"]');

      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });

  describe("puppeteer job operations", function () {
    this.timeout(20000);

    it("should open the jobs list and show 20 entries", async function () {
      const { expect } = await import("chai");

      this.jobsLink = await page.waitForSelector('a[href="/jobs"]');
      await this.jobsLink.click();
      await page.waitForNavigation();

      const html = await page.content();
      expect(html).to.include("Jobs List");

      const pageParts = html.split("<tr>");
      expect(pageParts.length).to.equal(21);
    });

    it("should open the add job form", async function () {
      this.addJobButton = await page.waitForSelector(
        "button ::-p-text(Add New Job)",
      );

      await this.addJobButton.click();
      await page.waitForNavigation();

      this.companyField = await page.waitForSelector('input[name="company"]');
      this.positionField = await page.waitForSelector('input[name="position"]');
      this.statusField = await page.waitForSelector('select[name="status"]');
      this.createButton = await page.waitForSelector(
        "button ::-p-text(Create)",
      );
    });

    it("should add a new job", async function () {
      const { expect } = await import("chai");

      this.newCompany = "Mojang";
      this.newPosition = "Software Engineer";

      await this.companyField.type(this.newCompany);
      await this.positionField.type(this.newPosition);
      await this.statusField.select("pending");
      await this.createButton.click();
      await page.waitForNavigation();

      const html = await page.content();
      expect(html).to.include("Jobs List");

      const jobs = await Job.find({ createdBy: testUser._id }).sort({
        createdAt: -1,
      });

      expect(jobs.length).to.equal(21);
      expect(jobs[0].company).to.equal(this.newCompany);
      expect(jobs[0].position).to.equal(this.newPosition);
      expect(jobs[0].status).to.equal("pending");
    });
  });
});
