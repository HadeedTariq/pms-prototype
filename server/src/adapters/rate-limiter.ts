import { Request } from "express";
import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req: Request) => {
    return req.body?.user?.id || req.ip;
  },
  message: { message: "View already counted today" },
  standardHeaders: true,
  legacyHeaders: false,
});
