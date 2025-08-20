import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app";

describe("health", () => {
  it("GET /api/health -> 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
