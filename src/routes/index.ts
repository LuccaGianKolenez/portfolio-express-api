import { Router } from "express";
import health from "./health";
import auth from "./auth";
import items from "./items";

const api = Router();
api.use("/health", health);
api.use("/auth", auth);
api.use("/items", items);

export default api;
