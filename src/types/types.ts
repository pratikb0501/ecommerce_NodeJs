import { NextFunction, Request, Response } from "express";
import { Document } from 'mongoose';

export interface NewUserRequestBody{
  name:string,
  email:string,
  photo:string,
  gender:string,
  _id:string,
  dob:string
}

export type ControllerType = (
  req: Request,
  res: Response, 
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>

export interface NewProductRequestBody{
  name:string,
  description:string,
  category:string,
  price:number,
  stock:number
}

export type SearchRequestQuery={
  search?: string;
  price?: string;
  category?: string;
  sort?:string;
  page?:string
}

export interface BaseQuery{
  name?:{
      $regex: string,
      $options: string,
  };
  price?:{$lte:number};
  category?:string
}

export type InvalidatesCacheProps = {
  product?:boolean;
  order?:boolean;
  admin?:boolean;
  userID?:string;
  orderID?:string;
  productID?:string | string[];
}


export type ShippingInfoType={
  address:string;
  city:string;
  state:string;
  country:string;
  zipcode:number;
}

export type OrderItemType={
  name:string,
  photo:string,
  price:number;
  quantity:number;
  productId:string;
}

export interface NewOrderRequestBody{
  shippingInfo:ShippingInfoType,
  user:string,
  subtotal:number,
  tax:number,
  shippingCharges:number,
  discount:number,
  total:number,
  orderedItems:OrderItemType[]
}


export interface MyDocument extends Document{
  createdAt:Date;
  discount?:number;
  total?:number
}