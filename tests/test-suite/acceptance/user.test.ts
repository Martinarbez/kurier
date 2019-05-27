import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import users from "./factories/user";
import http from "../test-app/http";
import getAuthenticationData from "./helpers/authenticateUser";

const request = agent(http) as SuperTest<Test>;

describe("Users", () => {
  describe("POST", () => {
    it("Create user", async () => {
      const result = await request.post("/users").send(users.forCreation.request);
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(users.forCreation.response);
    });
  });

  describe("PATCH", () => {
    it("Update a user", async () => {
      const result = await request.patch(`/users/2`).send(users.toUpdate.dataToUpdate);
      expect(result.body).toEqual(users.toUpdate.response);
      expect(result.status).toEqual(200);
    });
  });

  describe("GET", () => {
    it("Authenticated - Get all users", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/users").set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ data: users.toGet });
    });
  });
});
