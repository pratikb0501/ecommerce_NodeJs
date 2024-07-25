import express from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/products.js";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

//route - /api/v1/products/new
app.post("/new", adminOnly, singleUpload, newProduct);

//route - /api/v1/products/latest
app.get("/latest", getLatestProducts);

//route - /api/v1/products/categories
app.get("/categories", getAllCategories);

//route - /api/v1/products/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

//route - /api/v1/products/all
app.get("/all", getAllProducts);

//route - /api/v1/products/:id
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);


export default app;
