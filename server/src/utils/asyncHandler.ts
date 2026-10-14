import { NextFunction, Request, Response } from "express";

export function asyncHandler(handler: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch((err) => {
      console.log(err);
      next(err);
    });
  };
}
