import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(async (req, res, next) => {
  const { id } = req.query;
  if (!id) {
    return next(new ErrorHandler("Please login to make request", 401));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("Please provide valid ID", 400));
  }
  if (user.role !== "admin") {
    return next(
      new ErrorHandler("Admins are allowed to make this request", 400)
    );
  }

  next();
});
