import { Request, Response, NextFunction } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/orders.js";
import { invalidatesCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderedItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;


    if (!shippingInfo || !orderedItems || !user || !subtotal || !tax || !total)
      return next(new ErrorHandler("Please Enter all the fields", 400));

    const order = await Order.create({
      shippingInfo,
      orderedItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    await reduceStock(orderedItems);
    invalidatesCache({
      product: true,
      order: true,
      admin: true,
      userID: user,
      productID:order.orderedItems.map(o=>String(o.productId))
    });
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  }
);

export const getMyOrders = TryCatch(async (req, res, next) => {
  let { id } = req.query;
  const key = `my-orders-${id}`;
  let myOrders;

  if (myCache.has(key)) {
    myOrders = JSON.parse(myCache.get(key) as string);
  } else {
    myOrders = await Order.find({
      user: id,
    });

    myCache.set(key, JSON.stringify(myOrders));
  }
  return res.status(200).json({
    success: true,
    myOrders,
  });
});

export const getAllOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;
  let allOrders;

  if (myCache.has(key)) {
    allOrders = JSON.parse(myCache.get(key) as string);
  } else {
    allOrders = await Order.find().populate("user", "name");

    myCache.set(key, JSON.stringify(allOrders));
  }
  return res.status(200).json({
    success: true,
    allOrders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `orders-${id}`;
  let singleOrder;

  if (myCache.has(key)) {
    singleOrder = JSON.parse(myCache.get(key) as string);
  } else {
    singleOrder = await Order.findById(id).populate("user", "name");
    if (!singleOrder) {
      return next(new ErrorHandler("Order not found", 404));
    }
    myCache.set(key, JSON.stringify(singleOrder));
  }
  return res.status(200).json({
    success: true,
    singleOrder,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }

  switch (order.status) {
    case "Processing": {
      order.status = "Shipped";
      break;
    }
    case "Shipped": {
      order.status = "Delivered";
      break;
    }
    default: {
      order.status = "Delivered";
      break;
    }
  }

  await order.save();
  invalidatesCache({
    order: true,
    admin: true,
    userID: order.user ?? undefined,
    orderID: String(order._id),
  });
  return res.status(200).json({
    success: true,
    message: "Order processed successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new ErrorHandler("order not found", 404));
  }
  await order.deleteOne();
  invalidatesCache({
    order: true,
    admin: true,
    userID: order.user ?? undefined,
    orderID: String(order._id),
  });
  return res.status(200).json({
    success: true,
    message: "Order delete successfully",
  });
});
