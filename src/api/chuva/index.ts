import { Hono } from "hono";
import post from "./post";
import get from "./get";
import patch from "./patch";

export default new Hono()
  .route('/chuva', post)
  .route('/chuva', get)
  .route('/chuva', patch)