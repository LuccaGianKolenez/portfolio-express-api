import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app";

async function registerAndLogin() {
  const email = `u_${Date.now()}@test.dev`;
  const password = "secret123";
  await request(app).post("/api/auth/register").send({ name: "User", email, password }).expect(201);
  const login = await request(app).post("/api/auth/login").send({ email, password }).expect(200);
  return { token: login.body.access as string };
}

describe("auth + items", () => {
  it("CRUD item autenticado", async () => {
    const { token } = await registerAndLogin();
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app).post("/api/items").set(auth).send({ name: "Notebook", price: 1999.9 });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app).get("/api/items").set(auth);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const one = await request(app).get(`/api/items/${id}`).set(auth);
    expect(one.status).toBe(200);

    const patch = await request(app).patch(`/api/items/${id}`).set(auth).send({ price: 1799.9 });
    expect(patch.status).toBe(200);

    const del = await request(app).delete(`/api/items/${id}`).set(auth);
    expect(del.status).toBe(204);
  });
});
