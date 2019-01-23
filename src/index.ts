import Application from "./application";
import Authorize from "./decorators/authorize";
import decorateWith from "./decorators/decorator";
import jsonApiKoa from "./json-api-koa";
import KnexProcessor from "./knex-processor";
import OperationProcessor from "./operation-processor";
import Resource from "./resource";
import ResourceRegistry from "./resource-registry";

export {
  // Core objects
  Resource,
  jsonApiKoa,
  Application,
  KnexProcessor,
  ResourceRegistry,
  OperationProcessor,
  // Decorators API
  decorateWith,
  Authorize
};

export * from "./types";
