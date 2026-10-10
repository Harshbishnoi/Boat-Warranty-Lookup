jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const app = require("../src/app");
const prisma = require("../src/config/prisma");
const googleClient = OAuth2Client.mock.results[0].value;

describe("Authentication API", () => {
  let adminToken;
  let customerToken;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";

    await prisma.repair.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    const adminPassword =
      await bcrypt.hash(
        "admin123",
        10
      );

    const customerPassword =
      await bcrypt.hash(
        "customer123",
        10
      );

    await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "admin@test.com",
        password: adminPassword,
        role: "admin",
      },
    });

    await prisma.user.create({
      data: {
        name: "Test Customer",
        email: "customer@test.com",
        password: customerPassword,
        role: "customer",
      },
    });

    const adminLogin =
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@test.com",
          password: "admin123",
        });

    adminToken =
      adminLogin.body.data.token;

    const customerLogin =
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "customer@test.com",
          password: "customer123",
        });

    customerToken =
      customerLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("registers a customer", async () => {
    const response =
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "New User",
          email:
            `new-${Date.now()}@test.com`,
          password: "password123",
        });

    expect(response.statusCode)
      .toBe(201);

    expect(
      response.body.success
    ).toBe(true);

    expect(
      response.body.data.token
    ).toBeDefined();
  });

  test("rejects duplicate email", async () => {
    const response =
      await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Duplicate",
          email: "admin@test.com",
          password: "password123",
        });

    expect(response.statusCode)
      .toBe(409);

    expect(
      response.body.error.code
    ).toBe(
      "EMAIL_ALREADY_EXISTS"
    );
  });

  test("logs in with valid credentials", async () => {
    const response =
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@test.com",
          password: "admin123",
        });

    expect(response.statusCode)
      .toBe(200);

    expect(
      response.body.data.token
    ).toBeDefined();

    expect(
      response.body.data.user.role
    ).toBe("admin");
  });

  test("rejects wrong password", async () => {
    const response =
      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@test.com",
          password: "wrongpassword",
        });

    expect(response.statusCode)
      .toBe(401);

    expect(
      response.body.error.code
    ).toBe(
      "INVALID_CREDENTIALS"
    );
  });

  test("creates an account after verifying a Google ID token", async () => {
    const email = `google-${Date.now()}@test.com`;
    const googleId = `google-sub-${Date.now()}`;

    googleClient.verifyIdToken.mockResolvedValueOnce({
    getPayload: () => ({
      sub: googleId,
      email,
      email_verified: true,
      name: "Google Customer",
    }),
    });

    const response = await request(app)
    .post("/api/v1/auth/google")
    .send({ credential: "valid-google-id-token" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.token).toBeDefined();
    expect(googleClient.verifyIdToken).toHaveBeenCalledWith({
    idToken: "valid-google-id-token",
    audience: "test-google-client-id",
    });

    const user = await prisma.user.findUnique({
    where: { googleId },
    });
    expect(user.email).toBe(email);
    expect(user.password).toBeNull();
  });

  test("links Google sign-in to an existing account with a verified matching email", async () => {
    const email = `link-${Date.now()}@test.com`;
    const googleId = `google-link-${Date.now()}`;
    const password = await bcrypt.hash("customer123", 10);
    const existingUser = await prisma.user.create({
    data: {
      name: "Existing Customer",
      email,
      password,
      role: "customer",
    },
    });

    googleClient.verifyIdToken.mockResolvedValueOnce({
    getPayload: () => ({
      sub: googleId,
      email,
      email_verified: true,
      name: "Google Customer",
    }),
    });

    const response = await request(app)
    .post("/api/v1/auth/google")
    .send({ credential: "valid-google-id-token" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.user.id).toBe(existingUser.id);
    expect(
    await prisma.user.count({ where: { email } })
    ).toBe(1);
    expect(
    await prisma.user.findUnique({ where: { id: existingUser.id } })
    ).toMatchObject({ googleId, role: "customer" });
  });

  test("rejects an unverified Google email", async () => {
    googleClient.verifyIdToken.mockResolvedValueOnce({
    getPayload: () => ({
      sub: "unverified-google-subject",
      email: "unverified@test.com",
      email_verified: false,
    }),
    });

    const response = await request(app)
    .post("/api/v1/auth/google")
    .send({ credential: "unverified-google-id-token" });

    expect(response.statusCode).toBe(401);
    expect(response.body.error.code).toBe(
    "UNVERIFIED_GOOGLE_ACCOUNT"
    );
  });

  test("/me works with valid token", async () => {
    const response =
      await request(app)
        .get("/api/v1/auth/me")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

    expect(response.statusCode)
      .toBe(200);

    expect(
      response.body.data.email
    ).toBe("admin@test.com");

    expect(
      response.body.data.role
    ).toBe("admin");
  });

  test("/me rejects missing token", async () => {
    const response =
      await request(app)
        .get("/api/v1/auth/me");

    expect(response.statusCode)
      .toBe(401);
  });

  test("/me rejects invalid token", async () => {
    const response =
      await request(app)
        .get("/api/v1/auth/me")
        .set(
          "Authorization",
          "Bearer invalid.token.value"
        );

    expect(response.statusCode)
      .toBe(401);

    expect(
      response.body.error.code
    ).toBe(
      "INVALID_TOKEN"
    );
  });
});