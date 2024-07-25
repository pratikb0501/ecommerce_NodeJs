import express from "express";
import {
  getStats,
  getPieStats,
  getBarStats,
  getLineStats,
} from "../controllers/stats.js";
import { adminOnly } from "../middlewares/auth.js";

const app = express.Router();

//route /api/v1/dashboard/stats
app.get("/stats", adminOnly, getStats);

//route /api/v1/dashboard/pie
app.get("/pie", adminOnly, getPieStats);

//route /api/v1/dashboard/bar
app.get("/bar", adminOnly, getBarStats);

//route /api/v1/dashboard/line
app.get("/line", adminOnly, getLineStats);

export default app;
