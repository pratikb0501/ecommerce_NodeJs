import mongoose,{Schema} from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter name of product"],
    },
    description: {
      type: String,
      required: [true, "Please enter description of product"],
    },
    photo: {
      type: String,
      required: [true, "Please add photo"],
    },
    price: {
      type: Number,
      required: [true, "Please enter price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter the quantity"],
    },
    category: {
      type: String,
      required: [true, "Please add photo"],
      trim:true
    },
    
  },
  {
    timestamps: true,
  }
)

export const Product = mongoose.model("Product", productSchema);