import * as Knex from "knex";
import { Application, KnexProcessor, UserManagementAddon, UserManagementAddonOptions } from "./jsonapi-ts";
import ArticleProcessor from "./processors/article";
import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";
import VoteProcessor from "./processors/vote";
import knexfile from "./../../data/knexfile";
import login from "./callbacks/login";
import MyVeryOwnUserProcessor from "./processors/user";
import { ApplicationInstance } from "../../../src";

const app = new Application({
  namespace: "api",
  types: [Article, Comment, Vote],
  processors: [ArticleProcessor, VoteProcessor],
  defaultProcessor: KnexProcessor
});

app.use(UserManagementAddon, {
  userResource: User,
  userProcessor: MyVeryOwnUserProcessor,
  userLoginCallback: login,
  async userRolesProvider(this: ApplicationInstance, user: User) {
    return ["Admin"];
  }
  // userGenerateIdCallback: async () => (-Date.now()).toString(),
  // userEncryptPasswordCallback: encryptPassword
} as UserManagementAddonOptions);

app.services.knex = Knex(knexfile["test"]);

export default app;
