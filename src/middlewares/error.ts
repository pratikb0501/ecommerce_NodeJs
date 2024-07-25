import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleWare = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message = err.message || "Internal server error";
  err.statusCode = err.statusCode || 500;

  if (err.name == "CastError") {
    err.message = "Invalid ID";
  }

  return res.status(err.statusCode).json({
    success: false,
    error: err.message,
  });
};

export const TryCatch = (funct: ControllerType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(funct(req, res, next)).catch(next);
  };
};
