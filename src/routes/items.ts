import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const itemCreate = z.object({
  name: z.string().min(1).max(120),
  price: z.coerce.number().positive()
});

const itemUpdate = itemCreate.partial();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

router.post("/", async (req, res, next) => {
  try {
    const data = itemCreate.parse(req.body);
    const userId = (req as any).user.sub as string;
    const item = await prisma.item.create({
      data: { name: data.name, price: data.price, ownerId: userId }
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res) => {
  const it = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!it) return res.status(404).json({ error: "NotFound" });
  res.json(it);
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = itemUpdate.parse(req.body);
    const it = await prisma.item.update({ where: { id: req.params.id }, data });
    res.json(it);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res) => {
  await prisma.item.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
