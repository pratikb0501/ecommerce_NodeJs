import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/products.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utils/features.js";

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    if (!photo) {
      return next(new ErrorHandler("Please add photo", 400));
    }

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {});
      return next(new ErrorHandler("Please enter all fields", 400));
    }

    const product = await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidatesCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: `Product Added`,
    });
  }
);

//Revalidate cache on new,update, delete product and on new order
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let latestProducts;
  if (myCache.has("latest-products")) {
    latestProducts = JSON.parse(myCache.get("latest-products") as string);
  } else {
    latestProducts = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(latestProducts));
  }

  return res.status(201).json({
    success: true,
    latestProducts,
  });
});

//Revalidate cache on new,update, delete product and on new order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }
  return res.status(201).json({
    success: true,
    categories,
  });
});

//Revalidate cache on new,update, delete product and on new order
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let adminProducts;

  if (myCache.has("admin-products")) {
    adminProducts = JSON.parse(myCache.get("adminProducts") as string);
  } else {
    adminProducts = await Product.find();
    myCache.set("admin-products", JSON.stringify(adminProducts));
  }

  return res.status(201).json({
    success: true,
    adminProducts,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  let product;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 400));
    }
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(201).json({
    success: true,
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  if (photo) {
    rm(product.photo, () => {});
    product.photo = photo.path;
  }

  if (name) {
    product.name = name;
  }
  if (price) {
    product.price = price;
  }
  if (stock) {
    product.stock = stock;
  }
  if (category) {
    product.category = category;
  }

  await product.save();
  invalidatesCache({
    product: true,
    admin: true,
    productID: String(product._id),
  });

  return res.status(201).json({
    success: true,
    message: `Product Updated`,
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 400));
  }

  rm(product.photo, () => {});

  await product.deleteOne();
  invalidatesCache({
    product: true,
    admin: true,
    productID: String(product._id),
  });

  return res.status(201).json({
    success: true,
    message: `Product Deleted`,
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }

    if (category) {
      baseQuery.category = category;
    }

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const filteredProductsPromise = Product.find(baseQuery);

    const [products, filteredProducts] = await Promise.all([
      productsPromise,
      filteredProductsPromise,
    ]);

    const totalPages = Math.ceil(filteredProducts.length / limit);

    return res.status(201).json({
      success: true,
      products,
      totalPages,
    });
  }
);
