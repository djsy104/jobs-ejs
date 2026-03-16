const { app } = require("../app");
const Job = require("../models/Job");
const { seed_db, testUserPassword, factory } = require("../utils/seed_db");
const get_chai = require("../utils/get_chai");

describe("crud operations", function () {
  before(async () => {
    const { expect, request } = await get_chai();

    this.test_user = await seed_db();

    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;

    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];

    let cookies = res.headers["set-cookie"];

    const csrfCookies = cookies.filter((element) =>
      element.startsWith("__Host-csrfToken"),
    );
    this.csrfCookie = csrfCookies[csrfCookies.length - 1].split(";")[0];

    const sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    this.sessionCookie = sessionCookie.split(";")[0];

    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };

    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    res = await req;

    cookies = res.headers["set-cookie"];
    const newSessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    this.sessionCookie = newSessionCookie.split(";")[0];

    expect(this.csrfToken).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should get the jobs list", async () => {
    const { expect, request } = await get_chai();

    const req = request
      .execute(app)
      .get("/jobs")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .send();

    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21);
  });

  it("should add a job", async () => {
    const { expect, request } = await get_chai();

    const job = await factory.build("job");

    const dataToPost = {
      company: job.company,
      position: job.position,
      status: job.status,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/jobs")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    const res = await req;

    expect(res).to.have.status(200);

    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21);
  });
});
