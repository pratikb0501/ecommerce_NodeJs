import { connectDB } from "./utils/features.js";
import express from "express";
import { errorMiddleWare } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";

//Importing Routes
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoutes from "./routes/stats.js";
import Stripe from "stripe";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

config({
  path: "./.env",
});

const PORT = process.env.PORT || 4000;
const mongoUri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@ecomcluster0.rznfbgn.mongodb.net/?retryWrites=true&w=majority&appName=ecomcluster0`;
const stripeKey = `${process.env.STRIPE_KEY}`;

connectDB(mongoUri);

export const stripe = new Stripe(stripeKey);
export const myCache = new NodeCache(); // saves data into memory

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Titan Store API",
      version: "1.0.0",
      description: "API endpoints for ecommerce documented using swagger",
    },
    servers: [
      {
        url: `http://localhost:4000`,
      },
    ],
  },
  apis: ["./routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(express.json());
app.use(morgan("dev"));

// Using Routes

app.use("/api/v1/user", userRoutes); //user
app.use("/api/v1/products", productRoutes); //products
app.use("/api/v1/orders", orderRoutes); //orders
app.use("/api/v1/payment", paymentRoutes); //payment and coupon
app.use("/api/v1/dashboard", dashboardRoutes); //stats for dashboard

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleWare);

app.listen(process.env.PORT, () => {
  console.log("Express is listening on ", PORT);
});
