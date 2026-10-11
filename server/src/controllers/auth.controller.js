const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const prisma = require("../config/prisma");
const googleClient = new OAuth2Client();

const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
} = require("../validators/auth.validator.js");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const register = async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration data",
          fields: result.error.flatten().fieldErrors,
        },
      });
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email already exists",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "customer",
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    req.log.error(
    { err: error },
    "Register failed");

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to register user",
      },
    });
  }
};

const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login data",
          fields: result.error.flatten().fieldErrors,
        },
      });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const passwordMatches =
      user.password &&
      await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    req.log.error({ err: error },"Get current user failed");

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to login",
      },
    });
  }
};

const googleLogin = async (req, res) => {
  const result = googleLoginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "A valid Google credential is required",
        fields: result.error.flatten().fieldErrors,
      },
    });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    req.log.error("GOOGLE_CLIENT_ID is not configured");
    return res.status(503).json({
      success: false,
      error: {
        code: "GOOGLE_AUTH_NOT_CONFIGURED",
        message: "Google sign-in is not configured",
      },
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: result.data.credential,
      audience: googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    if (
      ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].includes(
        error.code
      )
    ) {
      req.log.error({ err: error }, "Google token verification unavailable");
      return res.status(503).json({
        success: false,
        error: {
          code: "GOOGLE_AUTH_UNAVAILABLE",
          message: "Google sign-in is temporarily unavailable",
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_GOOGLE_CREDENTIAL",
        message: "Google sign-in could not be verified",
      },
    });
  }

  if (
    !payload?.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNVERIFIED_GOOGLE_ACCOUNT",
        message: "A verified Google email address is required",
      },
    });
  }

  try {
    const email = payload.email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        take: 2,
      });

      if (matchingUsers.length > 1) {
        return res.status(409).json({
          success: false,
          error: {
            code: "AMBIGUOUS_EMAIL_ACCOUNT",
            message:
              "More than one account uses this email address. Contact support to link your account.",
          },
        });
      }

      if (matchingUsers.length === 1) {
        user = await prisma.user.update({
          where: { id: matchingUsers[0].id },
          data: { googleId: payload.sub },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: payload.name?.trim() || email.split("@")[0],
            email,
            googleId: payload.sub,
            role: "customer",
          },
        });
      }
    }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          code: "GOOGLE_ACCOUNT_ALREADY_LINKED",
          message:
            "This Google account or email is already linked to another account",
        },
      });
    }

    req.log.error({ err: error }, "Google sign-in failed");
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sign in with Google",
      },
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    req.log.error({ err: error },"Login failed");

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
      },
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
};