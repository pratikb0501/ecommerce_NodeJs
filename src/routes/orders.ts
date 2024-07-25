import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  deleteOrder,
  getAllOrders,
  getMyOrders,
  getSingleOrder,
  newOrder,
  processOrder,
} from "../controllers/orders.js";

const app = express.Router();

// route - /api/v1/orders/new
app.post("/new", newOrder);

// route - /api/v1/orders/my
app.get("/my", getMyOrders);

// route - /api/v1/orders/all
app.get("/all", adminOnly, getAllOrders);

// route - /api/v1/orders/:id
app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder);

export default app;
