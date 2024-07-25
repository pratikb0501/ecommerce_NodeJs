import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/orders.js";
import { Product } from "../models/products.js";
import { User } from "../models/user.js";
import {
  calculatePercentage,
  getCategoriesInventory,
  getChartData,
} from "../utils/features.js";

export const getStats = TryCatch(async (req, res, next) => {
  let stats = {};
  if (myCache.has("admin-stats")) {
    stats = JSON.parse(myCache.get("admin-stats") as string);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const currentMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };
    const previousMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    //get this months products data
    const currentMonthsProductsPromise = Product.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    //get previous months products data
    const prevMonthsProductsPromise = Product.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    //get this months user data
    const currentMonthUsersPromise = User.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    //get previous months user data
    const prevMonthUsesPromise = User.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    //get this months order data
    const currentMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: currentMonth.start,
        $lte: currentMonth.end,
      },
    });

    //get previous months user data
    const prevMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: previousMonth.start,
        $lte: previousMonth.end,
      },
    });

    const prevSixMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    // const foo = Order.aggregate([
    //   {
    //     $match:{
    //       createdAt:{
    //         $gte:sixMonthsAgo,
    //         $lte:today
    //       }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: { $dateToString: { format: "%m", date: "$createdAt" } },
    //       orderCount: { $sum: 1 },
    //       revenue: { $sum: "$total" }
    //     }
    //   },
    //   {
    //     $sort: {
    //       _id: 1
    //     }
    //   }
    // ])

    const latestTransactionPromise = Order.find()
      .select(["orderedItems", "discount", "total", "status"])
      .limit(4);

    const [
      currentMonthProducts,
      prevMonthsProducts,
      currentMonthUsers,
      prevMonthUsers,
      currentMonthOrders,
      prevMonthOrders,
      productsCount,
      usersCount,
      allOrders,
      prevSixMonthsOrders,
      categories,
      femaleUsersCount,
      latestTransaction,
    ] = await Promise.all([
      currentMonthsProductsPromise,
      prevMonthsProductsPromise,
      currentMonthUsersPromise,
      prevMonthUsesPromise,
      currentMonthOrdersPromise,
      prevMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      prevSixMonthsOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionPromise,
    ]);

    const currentMonthRevenue = currentMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const previousMonthRevenue = prevMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const percentChange = {
      revenue: calculatePercentage(currentMonthRevenue, previousMonthRevenue),
      products: calculatePercentage(
        currentMonthProducts.length,
        prevMonthsProducts.length
      ),
      users: calculatePercentage(
        currentMonthUsers.length,
        prevMonthUsers.length
      ),
      orders: calculatePercentage(
        currentMonthOrders.length,
        prevMonthOrders.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const counts = {
      revenue,
      products: productsCount,
      users: usersCount,
      orders: allOrders.length,
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderRevenueCounts = new Array(6).fill(0);

    prevSixMonthsOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        orderMonthCounts[5 - monthDiff] += 1;
        orderRevenueCounts[5 - monthDiff] += order.total;
      }
    });

    const categoryCount = await getCategoriesInventory({
      categories,
      productsCount,
    });

    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    const modifiedLatestTransaction = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderedItems.length,
      status: i.status,
    }));

    stats = {
      percentChange,
      counts,
      chart: {
        order: orderMonthCounts,
        revenue: orderRevenueCounts,
      },
      categoryCount,
      userRatio,
      latestTransaction: modifiedLatestTransaction,
    };

    myCache.set(
      "admin-stats",
      JSON.stringify({
        stats,
      })
    );
  }

  return res.status(200).json({
    success: true,
    dashboardStats: stats,
  });
});

export const getPieStats = TryCatch(async (req, res, next) => {
  let pieCharts;
  if (myCache.has("admin-pie-charts")) {
    JSON.parse(myCache.get("admin-pie-charts") as string);
  } else {
    const allOrdersPromise = Order.find().select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productsOutOfStock,
      allOrders,
      usersDOB,
      adminCount,
      customersCount,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find().select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullFillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const categoryCount = await getCategoriesInventory({
      categories,
      productsCount,
    });

    const stockAvailability = {
      outOfStock: productsOutOfStock,
      inStock: productsCount - productsOutOfStock,
    };

    let grossMargin: number = 0;
    let discount: number = 0;
    let shippingCost: number = 0;
    let tax: number = 0;
    let marketingCost: number = 0;

    allOrders.forEach((order) => {
      grossMargin += order.total ? order.total : 0;
      discount += order.discount ? order.discount : 0;
      // shippingCost += order.shippingCharges ? order.shippingCharges : 0;
      // tax += order.tax ? order.tax :0 ;
      marketingCost = Math.round(grossMargin * 0.3);
    });

    const netMargin =
      grossMargin - discount - shippingCost - tax - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      shippingCost,
      tax,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: usersDOB.filter((user) => user.age < 20).length,
      adult: usersDOB.filter((user) => user.age >= 20 && user.age < 40).length,
      old: usersDOB.filter((user) => user.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminCount,
      customer: customersCount,
    };

    pieCharts = {
      orderFullFillment,
      categoryCount,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      usersAgeGroup,
    };

    // pieCharts = await Order.aggregate([
    //   {
    //     $match: { status: { $in: ["Processing", "Shipped", "Delivered"] } },
    //   },
    //   {
    //     $group: {
    //       _id: "$status",
    //       count: { $sum: 1 },
    //     },
    //   },
    // ]);

    myCache.set("admin-pie-charts", JSON.stringify(pieCharts));
  }

  return res.status(200).json({
    success: true,
    pieCharts,
  });
});

export const getBarStats = TryCatch(async (req, res, next) => {
  let barChart;
  const key = "admin-bar-charts";
  if (myCache.has(key)) {
    barChart = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const lastSixMonthsProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const lastSixMonthsUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const lastTwelveMonthsOrderPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [SixMonthsProducts, SixMonthsUsers, TwelveMonthsOrders] =
      await Promise.all([
        lastSixMonthsProductsPromise,
        lastSixMonthsUsersPromise,
        lastTwelveMonthsOrderPromise,
      ]);

    const productCounts = getChartData({
      length: 6,
      documents: SixMonthsProducts,
    });
    const userCounts = getChartData({
      length: 6,
      documents: SixMonthsUsers,
    });
    const orderCounts = getChartData({
      length: 12,
      documents: TwelveMonthsOrders,
    });

    barChart = {
      users: userCounts,
      products: productCounts,
      orders: orderCounts,
    };
    myCache.set(key, JSON.stringify(barChart));
  }

  return res.status(200).json({
    success: true,
    barChart,
  });
});

export const getLineStats = TryCatch(async (req, res, next) => {
  let lineChart;
  const key = "admin-line-charts";
  if (myCache.has(key)) {
    lineChart = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };
    const lastTwelveMonthsProductsPromise =
      Product.find(baseQuery).select("createdAt");
    const lastTwelveMonthsUsersPromise =
      User.find(baseQuery).select("createdAt");
    const lastTwelveMonthsOrderPromise = Order.find(baseQuery).select([
      "createdAt",
      "discount",
      "total",
    ]);

    const [
      TwelveMonthsProducts,
      TwelveMonthsUsers,
      TwelveMonthsOrders,
    ] = await Promise.all([
      lastTwelveMonthsProductsPromise,
      lastTwelveMonthsUsersPromise,
      lastTwelveMonthsOrderPromise,
    ]);

    const productCounts = getChartData({
      length: 12,
      documents: TwelveMonthsProducts,
    });
    const userCounts = getChartData({
      length: 12,
      documents: TwelveMonthsUsers,
    });
    const revenueCounts = getChartData({
      length: 12,
      documents: TwelveMonthsOrders,
      property: "total",
    });
    const discountCounts = getChartData({
      length: 12,
      documents: TwelveMonthsOrders,
      property: "discount",
    });

    lineChart = {
      users: userCounts,
      products: productCounts,
      discount: discountCounts,
      revenue: revenueCounts,
    };
    myCache.set(key, JSON.stringify(lineChart));
  }

  return res.status(200).json({
    success: true,
    lineChart,
  });
});
