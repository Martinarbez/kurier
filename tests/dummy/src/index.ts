import * as Koa from "koa";
import * as koaBodyParser from "koa-bodyparser";

import { Application, jsonApiKoa, KnexProcessor } from "./jsonapi-ts";
import User from "./resources/user/resource";

const app = new Application({
  types: [User],
  processors: [],
  defaultProcessor: new KnexProcessor({
    client: "sqlite3",
    connection: {
      file: ":memory:"
    },
    useNullAsDefault: true
  })
});

const koa = new Koa();

koa.use(koaBodyParser());
koa.use(jsonApiKoa(app));
koa.listen(3000);

console.log("Server up on port 3000");
