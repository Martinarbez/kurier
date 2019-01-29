import * as camelize from "camelize";
import * as dasherize from "dasherize";

import { ResourceTypeAttributes, ResourceTypeRelationships } from "./types";

export default abstract class Resource {
  public type: string;
  public id?: string;
  public attributes: ResourceTypeAttributes;
  public relationships: ResourceTypeRelationships;

  constructor({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: ResourceTypeAttributes;
    relationships?: ResourceTypeRelationships;
  }) {
    this.type = camelize(dasherize(this.constructor.name));

    this.id = id;
    this.attributes = attributes || {};
    this.relationships = relationships || {};
  }
}
