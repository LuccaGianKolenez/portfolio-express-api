import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "ValidationError", details: err.flatten() });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({ error: "PrismaError", code: err.code, meta: err.meta });
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(status).json({ error: "Error", message });
}
