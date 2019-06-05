import { Context, Middleware } from "koa";
import * as koaBody from "koa-body";
import * as compose from "koa-compose";

import Application from "../application";
import ApplicationInstance from "../application-instance";
import {
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertErrorToHttpResponse
} from "../utils/http-utils";

export default function jsonApiKoa(app: Application, ...middlewares: Middleware[]) {
  const jsonApiKoa = async (ctx: Context, next: () => Promise<any>) => {
    const appInstance = new ApplicationInstance(app);

    try {
      await authenticate(appInstance, ctx.request);
    } catch (error) {
      ctx.body = convertErrorToHttpResponse(error);
      ctx.status = error.status;
      return next();
    }

    ctx.request["urlData"] = urlData(appInstance, ctx.path);

    if (ctx.method === "PATCH" && ctx.request["urlData"].resource === "bulk") {
      ctx.body = await handleBulkEndpoint(appInstance, ctx.request.body.operations);
      return next();
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, ctx.request);
    ctx.body = body;
    ctx.status = status;
    return next();
  };

  return compose([koaBody({ json: true }), ...middlewares, jsonApiKoa]);
}
