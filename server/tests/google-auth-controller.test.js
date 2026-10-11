jest.mock("../src/config/prisma", () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

const prisma = require("../src/config/prisma");
const { OAuth2Client } = require("google-auth-library");
const request = require("supertest");
const app = require("../src/app");
const { googleLogin } = require("../src/controllers/auth.controller");

const googleClient = OAuth2Client.mock.results[0].value;

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("Google authentication controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  test("rejects an invalid Google ID token", async () => {
    googleClient.verifyIdToken.mockRejectedValueOnce(
      new Error("Invalid token")
    );
    const req = {
      body: { credential: "invalid-token" },
      log: { error: jest.fn() },
    };
    const res = makeResponse();

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "INVALID_GOOGLE_CREDENTIAL",
        }),
      })
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test("requires a verified email from Google", async () => {
    googleClient.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: "google-subject",
        email: "customer@example.com",
        email_verified: false,
      }),
    });
    const req = {
      body: { credential: "valid-token" },
      log: { error: jest.fn() },
    };
    const res = makeResponse();

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test("creates an account and returns an application JWT", async () => {
    const user = {
      id: 42,
      name: "Google Customer",
      email: "customer@example.com",
      role: "customer",
      googleId: "google-subject",
    };

    googleClient.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: user.googleId,
        email: user.email,
        email_verified: true,
        name: user.name,
      }),
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.findMany.mockResolvedValueOnce([]);
    prisma.user.create.mockResolvedValueOnce(user);
    const response = await request(app)
      .post("/api/v1/auth/google")
      .send({ credential: "valid-token" });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: user.name,
        email: user.email,
        googleId: user.googleId,
        role: "customer",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: user.id }),
          token: expect.any(String),
        }),
      })
    );
  });

  test("links a verified Google address to the matching existing account", async () => {
    const user = {
      id: 17,
      name: "Existing Customer",
      email: "customer@example.com",
      role: "customer",
      googleId: "google-subject",
    };

    googleClient.verifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: user.googleId,
        email: user.email,
        email_verified: true,
      }),
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.findMany.mockResolvedValueOnce([{ id: user.id }]);
    prisma.user.update.mockResolvedValueOnce(user);
    const req = {
      body: { credential: "valid-token" },
      log: { error: jest.fn() },
    };
    const res = makeResponse();

    await googleLogin(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { googleId: user.googleId },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("reports missing Google server configuration", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const req = {
      body: { credential: "valid-token" },
      log: { error: jest.fn() },
    };
    const res = makeResponse();

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(googleClient.verifyIdToken).not.toHaveBeenCalled();
  });
});
