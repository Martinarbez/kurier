import { knex } from "knex";
import {
  Application,
  ApplicationInstanceInterface,
  KnexProcessor,
  UserManagementAddon,
  UserManagementAddonOptions,
} from "./kurier";

import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";
import Random from "./resources/random";

import knexfile from "./dummy-data/knexfile";
import login from "./callbacks/login";

import UserProcessor from "./processors/user";
import ArticleProcessor from "./processors/article";
import VoteProcessor from "./processors/vote";
import RandomProcessor from "./processors/random";
import LatitudeLongitude from "./attribute-types/latitude-longitude";
import Tag from "./resources/tag";

const app = new Application({
  namespace: "api",
  types: [Article, Comment, Vote, Random, Tag],
  processors: [ArticleProcessor, VoteProcessor, RandomProcessor],
  defaultProcessor: KnexProcessor,
});

app.registerAttributeType(LatitudeLongitude);

app.use(UserManagementAddon, {
  userResource: User,
  userProcessor: UserProcessor,
  userLoginCallback: login,
  async userRolesProvider(this: ApplicationInstanceInterface, user: User) {
    return ["Admin"];
  },
  // userGenerateIdCallback: async () => (-Date.now()).toString(),
  // userEncryptPasswordCallback: encryptPassword
} as UserManagementAddonOptions);

app.services.knex = knex(knexfile["development"]);

export default app;
