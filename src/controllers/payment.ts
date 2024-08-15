import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";

export const createPayment = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorHandler("Please provide valid amount", 400));
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number((amount * 100).toFixed(0)),
    currency: "usd",
  });


  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { couponCode, amount } = req.body;
  if (!couponCode || !amount) {
    return next(new ErrorHandler("Please enter coupon code and amount", 400));
  }
  await Coupon.create({
    couponCode:couponCode.toLowerCase(),
    amount,
  });
  return res.status(201).json({
    success: true,
    message: `Coupon ${couponCode} created`,
  });
});

export const allCoupon = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find();
  return res.status(201).json({
    success: true,
    coupons: coupons,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { couponCode } = req.query;
  const discount = await Coupon.findOne({ couponCode });
  if (!discount) {
    return next(new ErrorHandler("Invalid Coupon Code", 400));
  }
  return res.status(201).json({
    success: true,
    discount: discount.amount,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    return next(new ErrorHandler("Invalid Coupon Code", 400));
  }
  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon.couponCode} deleted successfully`,
  });
});
