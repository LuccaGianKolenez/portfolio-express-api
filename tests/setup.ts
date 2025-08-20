import { beforeAll, afterAll } from "vitest";
import { prisma } from "../src/prisma";

beforeAll(async () => {
  // Preparos antes dos testes (ex.: limpar DB) — opcional
});

afterAll(async () => {
  await prisma.$disconnect();
});
