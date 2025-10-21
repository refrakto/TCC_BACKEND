import { Hono } from "hono";
import post from "./post";
import get from "./get";
import patch from "./patch";

export default new Hono()
  .post('/', post)
  .get('/', get)
  .patch('/', patch)