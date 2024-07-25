import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "../middlewares/error.js";


export const newUser = TryCatch(async (req:Request<{},{},NewUserRequestBody>, res:Response, next:NextFunction) => {
  const { name, email, photo, gender, _id, dob } = req.body;
  let user = await User.findById(_id);

  if (user) {
    return res.status(200).json({
      success: true,
      message: `Welcome again, ${name}`,
    });
  }

  if (!name || !email || !photo || !gender || !_id || !dob) {
    return next(new ErrorHandler("Please enter all the fields", 400));
  }

  await User.create({
    name,
    email,
    photo,
    gender,
    _id,
    dob: new Date(dob),
  });
  return res.status(201).json({
    success: true,
    message: `Welcome, ${name}`,
  });
});


/**
 * @swagger
 * tags:
 *   name: User
 *   description: The books managing API
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The created book.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       500:
 *         description: Some server error
 *
 */

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find();
  return res.status(200).json({
    success: true,
    users,
  });
});

export const getUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("Invalid Id", 400));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("Invalid Id", 400));
  }

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
