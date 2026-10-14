import { env } from "@/common/utils/envConfig";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function checkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next({
        message: "Access Token not found",
        status: 404,
      });
    }

    const user = jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET);

    if (!user) {
      return next({
        message: "Invalid Access Token",
        status: 404,
      });
    }

    if (req.body === undefined) {
      req.body = {};
    }
    req.body.user = user;
    next();
  } catch (error) {
    return next({
      message:
        error instanceof jwt.JsonWebTokenError
          ? "Please authenticate to perform this action"
          : "Authentication Error",
      status: 401,
    });
  }
}

export function banChecker(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next({
        message: "Access Token not found",
        status: 404,
      });
    }

    const user: any = jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET);

    if (!user) {
      return next({
        message: "Invalid Access Token",
        status: 404,
      });
    }

    const isBanned = user.isBan;

    if (isBanned) {
      return next({
        message: "You are ban from the platform so can't perform this action",
        status: 404,
      });
    }

    req.body.user = user;
    next();
  } catch (error) {
    return next({
      message:
        error instanceof jwt.JsonWebTokenError
          ? "Please authenticate to perform this action"
          : "Authentication Error",
      status: 401,
    });
  }
}

export function authParser(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next();
    }

    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return next();
    }

    req.body.user = decoded;
    return next();
  } catch (error: any) {
    return next();
  }
}
