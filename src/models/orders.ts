import mongoose, { Schema } from "mongoose";
import validator from "validator";

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zipcode: {
        type: Number,
        required: true,
      },
    },
    user: {
      type: String,
      ref: "User",
      require: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default:0
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum:["Processing","Shipped","Delivered"],
      default:"Processing"
    },
    orderedItems:[{
      name:String,
      photo:String,
      price:Number,
      quantity:Number,
      productId:{
        type:mongoose.Types.ObjectId,
        required:true
      }
    }]
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);
