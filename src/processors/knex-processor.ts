import * as Knex from "knex";
import { Application } from "..";
import JsonApiErrors from "../json-api-errors";
import Resource from "../resource";
import { KnexRecord, Operation, ResourceConstructor, ResourceRelationshipData, ResourceRelationships, ResourceSchemaRelationship } from "../types";
import { camelize, pluralize } from "../utils/string";
import OperationProcessor, { HasId } from "./operation-processor";

const operators = {
  eq: "=",
  ne: "!=",
  lt: "<",
  gt: ">",
  le: "<=",
  ge: ">=",
  like: "like",
  in: "in",
  nin: "not in"
};

const getOperator = (paramValue: string): string =>
  operators[
    Object.keys(operators).find(
      operator => paramValue.indexOf(`${operator}:`) === 0
    )
  ];

const getWhereMethod = (value: string, operator: string) => {
  if (value !== "null") {
    return "andWhere";
  }

  if (value === "null" && operator === "=") {
    return "whereNull";
  }

  if (value === "null" && operator === "!=") {
    return "whereNotNull";
  }
};

const buildSortClause = (sort: string[]) =>
  sort.map(criteria => {
    if (criteria.startsWith("-")) {
      return { field: camelize(criteria.substr(1)), direction: "DESC" };
    }

    return { field: camelize(criteria), direction: "ASC" };
  });

const pick = (object = {}, list = []): {} => {
  return list.reduce((acc, key) => ({ ...acc, [key]: object[key] }), {});
};

const getColumns = (
  resourceClass: ResourceConstructor,
  fields = {}
): string[] => {
  const type = resourceClass.type;
  const { attributes, relationships } = resourceClass.schema;

  const relationshipsKeys = Object.entries(relationships)
    .filter(([key, value]) => value.belongsTo)
    .map(([key]) => `${key}Id`);

  let attributesKeys = Object.keys(attributes);

  if (Object.keys(fields).length) {
    attributesKeys = attributesKeys.filter(key =>
      fields[pluralize(type)].includes(key)
    );
  }

  return [...attributesKeys, ...relationshipsKeys, "id"];
};

export default class KnexProcessor<
  ResourceT = Resource
> extends OperationProcessor<ResourceT> {
  protected knex: Knex;

  constructor(app: Application) {
    super(app);
    this.knex = app.services.knex;
  }

  async get(op: Operation): Promise<HasId[]> {
    const { params, ref } = op;
    const { id, type } = ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return [];

    const tableName = this.typeToTableName(type);
    const filters = params ? { id, ...(params.filter || {}) } : { id };
    const fields = params ? { ...params.fields } : {};

    const records: KnexRecord[] = await this.knex(tableName)
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op))
      .select(getColumns(resourceClass, fields));

    return records;
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    const record = await this.knex(tableName)
      .where({ id: op.ref.id })
      .first();

    if (!record) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { id, type } = op.ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return;

    const tableName = this.typeToTableName(type);

    const updated = await this.knex(tableName)
      .where({ id })
      .first()
      .update(op.data.attributes);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.knex(tableName)
      .where({ id })
      .select(getColumns(resourceClass))
      .first();
  }

  async add(op: Operation): Promise<HasId> {
    const { type } = op.ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return;

    const tableName = this.typeToTableName(type);

    const ids = await this.knex(tableName).insert(op.data.attributes, "id");

    return await this.knex(tableName)
      .whereIn("id", ids)
      .select(getColumns(resourceClass))
      .first();
  }

  typeToTableName(type: string): string {
    return camelize(pluralize(type));
  }

  filtersToKnex(queryBuilder, filters: {}) {
    const processedFilters = [];

    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key]
    );

    Object.keys(filters).forEach(key => {
      let value = filters[key];
      const operator = getOperator(filters[key]) || "=";

      if (value.substring(value.indexOf(":") + 1)) {
        value = value.substring(value.indexOf(":") + 1);
      }

      processedFilters.push({
        value,
        operator,
        method: getWhereMethod(value, operator),
        column: camelize(key)
      });
    });

    return processedFilters.forEach(filter => {
      return queryBuilder[filter.method](
        filter.column,
        filter.operator,
        filter.value
      );
    });
  }

  optionsBuilder(queryBuilder, op) {
    const { sort, page } = op.params;
    if (sort) {
      buildSortClause(sort).forEach(({ field, direction }) => {
        queryBuilder.orderBy(field, direction);
      });
    }

    if (page) {
      queryBuilder.offset(page.offset).limit(page.limit);
    }
  }
}
