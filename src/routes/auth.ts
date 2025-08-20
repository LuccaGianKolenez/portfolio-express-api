import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { env } from "../env";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hash },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    return res.status(201).json(user);
  } catch (err) { next(err); }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: "InvalidCredentials" });
    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) return res.status(401).json({ error: "InvalidCredentials" });
    const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: "30m" });
    return res.json({ access: token });
  } catch (err) { next(err); }
});

export default router;
