import { Hono } from "hono";
import post from "./post";
import get from "./get";
import patch from "./patch";

export default new Hono()
  .route('/pluvi', post)
  .route('/pluvi', get)
  .route('/pluvi', patch)