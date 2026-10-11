const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

const googleLoginSchema = z.object({
  credential: z
    .string()
    .min(1, "Google credential is required")
    .max(8192, "Google credential is too large"),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
};