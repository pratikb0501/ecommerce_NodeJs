import dotenv from "dotenv";
import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/products.js";
import {
  InvalidatesCacheProps,
  OrderItemType,
  MyDocument,
} from "../types/types.js";
dotenv.config();

export const connectDB = async (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce",
    })
    .then((c) => {
      console.log(`DB is connected to ${c.connection.host}`);
    })
    .catch((error) => {
      console.log(error);
    });
};

export const invalidatesCache = ({
  product,
  order,
  admin,
  userID,
  orderID,
  productID,
}: InvalidatesCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "admin-products",
    ];

    if (typeof productID == "string") {
      productKeys.push(`product-${productID}`);
    }
    if (typeof productID == "object") {
      productID?.forEach((i) => {
        productKeys.push(`product-${i}`);
      });
    }

    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userID}`,
      `order-${orderID}`,
    ];
    myCache.del(orderKeys);
  }
  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderedItems: OrderItemType[]) => {
  for (let i = 0; i < orderedItems.length; i++) {
    const order = orderedItems[i];
    const product = await Product.findById(order.productId);
    if (!product) {
      throw new Error("Product Not Found");
    }
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth == 0) {
    return thisMonth * 100;
  }
  const percentage = (thisMonth / lastMonth) * 100;
  return percentage.toFixed(0);
};

export const getCategoriesInventory = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) => {
    return Product.countDocuments({ category });
  });

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) =>
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    })
  );

  return categoryCount;
};

export const getChartData = ({
  length,
  documents,
  property,
}: {
  length: number;
  documents: MyDocument[];
  property?: "discount" | "total";
}) => {
  const data: number[] = new Array(length).fill(0);
  const today = new Date();

  documents.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      data[length - 1 - monthDiff] += property ? i[property]! : 1;
    }
  });

  return data;
};
