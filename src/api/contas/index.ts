import { Hono } from "hono";
import post from "./post";

export default new Hono()
  .route('/', post)