import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  allCoupon,
  applyDiscount,
  deleteCoupon,
  newCoupon,
  createPayment,
} from "../controllers/payment.js";

const app = express.Router();

//route - /api/v1/payment/create
app.post("/create", createPayment);

//route - /api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);

//route - /api/v1/payment/coupon/all
app.get("/coupon/all", adminOnly, allCoupon);

//route - /api/v1/coupon/discount
app.get("/discount", applyDiscount);

//route - /api/v1/coupon/discount
app.delete("/coupon/:id", adminOnly, deleteCoupon);

export default app;
