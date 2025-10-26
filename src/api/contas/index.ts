import { Hono } from "hono";
import post from "./post";

export default new Hono()
  .route('/contas', post)