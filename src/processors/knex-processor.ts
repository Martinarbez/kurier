import * as Knex from "knex";
import JsonApiErrors from "../errors/json-api-errors";
import Resource from "../resource";
import {
  HasId,
  KnexRecord,
  Operation,
  ResourceSchemaRelationship,
  EagerLoadedData,
  DEFAULT_PRIMARY_KEY,
  IJsonApiSerializer,
  JsonApiParams,
  ResourceSchema
} from "../types";
import pick from "../utils/pick";
import promiseHashMap from "../utils/promise-hash-map";
import OperationProcessor from "./operation-processor";
import ApplicationInstance from "../application-instance";

const operators = {
  eq: "=",
  ne: "!=",
  lt: "<",
  gt: ">",
  le: "<=",
  ge: ">=",
  like: "like",
  nlike: "not like",
  in: "in",
  nin: "not in"
};

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

const buildSortClause = (sort: string[], resourceClass: typeof Resource, serializer: IJsonApiSerializer) => {
  return sort.map(criteria => {
    const direction = criteria.startsWith("-") ? "DESC" : "ASC";
    const attributeName = criteria.startsWith("-") ? criteria.substr(1) : criteria;

    const isCustomFK = Object.entries(resourceClass.schema.relationships)
      .filter(([, value]) => value.belongsTo)
      .map(([, value]) => value.foreignKeyName)
      .includes(attributeName);
    const field = isCustomFK ? attributeName : serializer.attributeToColumn(attributeName);

    return { field, direction };
  });
};

const getColumns = (resourceClass: typeof Resource, serializer: IJsonApiSerializer, fields = {}): string[] => {
  const { type, schema } = resourceClass;
  const { attributes, relationships, primaryKeyName } = schema;
  const relationshipsKeys = Object.entries(relationships)
    .filter(([, value]) => value.belongsTo)
    .map(
      ([key, value]) =>
        value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || DEFAULT_PRIMARY_KEY)
    );
  const typeFields = (fields[type] || []).filter((key: string) => Object.keys(attributes).includes(key));

  const attributesKeys: string[] = typeFields.length ? typeFields : Object.keys(attributes);

  return [
    ...attributesKeys.map(key => `${serializer.attributeToColumn(key)} as ${key}`),
    ...relationshipsKeys,
    primaryKeyName || DEFAULT_PRIMARY_KEY
  ];
};

export default class KnexProcessor<ResourceT extends Resource> extends OperationProcessor<ResourceT> {
  protected knex: Knex.Transaction;

  constructor(appInstance: ApplicationInstance) {
    super(appInstance);
    this.knex = appInstance.transaction;
  }

  getQuery(): Knex.QueryBuilder {
    return this.knex(this.tableName);
  }

  async eagerLoad(op: Operation, result: ResourceT | ResourceT[]) {
    const include = op.params ? op.params.include : [];
    const relationships = pick(this.resourceClass.schema.relationships, include);

    return promiseHashMap(relationships, (key: string) => {
      return this.eagerFetchRelationship(key, result);
    });
  }

  async get(op: Operation): Promise<HasId[] | HasId> {
    const { params, ref } = op;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    const records: KnexRecord[] = await this.getQuery()
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, params || {}))
      .select(getColumns(this.resourceClass, this.appInstance.app.serializer, (params || {}).fields));

    if (!records.length && id) {
      throw JsonApiErrors.RecordNotExists();
    }

    if (id) {
      return records[0];
    }
    return records;
  }

  async remove(op: Operation): Promise<void> {
    const { params, ref } = op;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    const record = await this.getQuery()
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .first();

    if (!record) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.getQuery()
      .where({ [primaryKey]: id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { params, ref } = op;
    const { id } = ref;
    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const filters = params ? { [primaryKey]: id, ...(params.filter || {}) } : { [primaryKey]: id };

    const dataToUpdate = Object.keys(op.data.attributes)
      .map(attribute => ({
        [this.appInstance.app.serializer.attributeToColumn(attribute)]: op.data.attributes[attribute]
      }))
      .reduce((keyValues, keyValue) => ({ ...keyValues, ...keyValue }), {});

    const updated = await this.getQuery()
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .first()
      .update(dataToUpdate);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.getQuery()
      .where({ [primaryKey]: id })
      .select(getColumns(this.resourceClass, this.appInstance.app.serializer))
      .first();
  }

  async add(op: Operation): Promise<HasId> {
    const primaryKeyName = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

    const dataToInsert = Object.keys(op.data.attributes)
      .map(attribute => ({
        [this.appInstance.app.serializer.attributeToColumn(attribute)]: op.data.attributes[attribute]
      }))
      .reduce((keyValues, keyValue) => ({ ...keyValues, ...keyValue }), {});

    if (op.data.id) {
      dataToInsert[primaryKeyName] = op.data.id;
    }

    const ids = await this.getQuery().insert(dataToInsert, primaryKeyName);

    return await this.getQuery()
      .whereIn(primaryKeyName, ids)
      .select(getColumns(this.resourceClass, this.appInstance.app.serializer))
      .first();
  }

  get tableName() {
    return this.appInstance.app.serializer.resourceTypeToTableName(this.resourceClass.type);
  }

  getValidAttributes(schema: ResourceSchema, serializer: IJsonApiSerializer) {
    const { attributes, relationships, primaryKeyName } = schema;
    const relationshipsKeys = Object.entries(relationships)
      .filter(([, value]) => value.belongsTo)
      .map(
        ([key, value]) =>
          value.foreignKeyName || serializer.relationshipToColumn(key, primaryKeyName || DEFAULT_PRIMARY_KEY)
      );

    return Object.keys(attributes)
      .concat(relationshipsKeys)
      .concat(primaryKeyName || DEFAULT_PRIMARY_KEY);
  }

  filtersToKnex(queryBuilder, filters: {}) {
    const processedFilters = [];

    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const validKeys = this.getValidAttributes(this.resourceClass.schema, this.appInstance.app.serializer);

    Object.keys(filters).forEach(key => {
      if (!validKeys.includes(key)) {
        if (!Object.keys(this.attributes).includes(key)) {
          throw JsonApiErrors.BadRequest(`${key} is not a valid field to filter`);
        } else {
          // TODO: ISSUE #183: remove this throw here, and put a return; to just skip this key when it appears.
          throw JsonApiErrors.BadRequest(`${key} is a computed property, and as such, can't be filtered`);
        }
      }
      const matches = String(filters[key]).split("|");

      processedFilters.push(
        ...matches.map((match: string) => {
          let value = "";
          let comparer = "";

          if (match.includes(":")) {
            [comparer, value] = match.split(":");
          } else {
            comparer = "eq";
            value = match;
          }

          const operator = operators[comparer];

          return {
            value,
            operator,
            method: getWhereMethod(value, operator),
            column:
              key === this.resourceClass.schema.primaryKeyName
                ? key
                : this.appInstance.app.serializer.attributeToColumn(key)
          };
        })
      );
    });

    return processedFilters.forEach(filter =>
      queryBuilder[filter.method](filter.column, filter.operator, filter.value)
    );
  }

  optionsBuilder(queryBuilder: Knex.QueryBuilder, params: JsonApiParams) {
    const { sort, page } = params;
    if (sort) {
      buildSortClause(sort, this.resourceClass, this.appInstance.app.serializer).forEach(({ field, direction }) => {
        queryBuilder.orderBy(field, direction);
      });
    }

    if (page) {
      queryBuilder.offset(page.offset || page.number * page.size).limit(page.limit || page.size);
    }
  }

  async getRelationships(op: Operation, record: HasId, eagerLoadedData: EagerLoadedData) {
    const include = op.params ? op.params.include : [];
    const relationships = pick(this.resourceClass.schema.relationships, include);

    return promiseHashMap(relationships, (key: string) => {
      if (relationships[key] instanceof Function) {
        return relationships[key].call(this, record);
      }

      const relationshipSchema = this.resourceClass.schema.relationships[key];

      return this.fetchRelationship(key, relationshipSchema, record, eagerLoadedData);
    });
  }

  async eagerFetchRelationship(key: string, result: ResourceT | ResourceT[]): Promise<KnexRecord[] | void> {
    const relationship = this.resourceClass.schema.relationships[key];
    const relationProcessor: KnexProcessor<Resource> = (await this.processorFor(
      relationship.type().type
    )) as KnexProcessor<Resource>;

    const query = relationProcessor.getQuery();
    const foreignTableName = relationProcessor.tableName;
    const foreignType = relationProcessor.resourceClass.type;
    const sqlOperator = Array.isArray(result) ? "in" : "=";

    const primaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

    const queryIn: string | string[] = Array.isArray(result)
      ? result.map((resource: Resource) => resource[primaryKey])
      : result[primaryKey];

    if (relationship.belongsTo) {
      const belongingPrimaryKey = relationship.type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
      const foreignKey =
        relationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(key, primaryKey);
      const belongingTableName = this.appInstance.app.serializer.foreignResourceToForeignTableName(foreignType);

      return query
        .join(this.tableName, `${belongingTableName}.${belongingPrimaryKey}`, "=", `${this.tableName}.${foreignKey}`)
        .where(`${this.tableName}.${primaryKey}`, sqlOperator, queryIn)
        .select(`${belongingTableName}.*`)
        .from(`${foreignTableName} as ${belongingTableName}`);
    }

    if (relationship.hasMany) {
      const foreignKey =
        relationship.foreignKeyName ||
        this.appInstance.app.serializer.relationshipToColumn(this.resourceClass.type, primaryKey);
      return query
        .join(this.tableName, `${foreignTableName}.${foreignKey}`, "=", `${this.tableName}.${primaryKey}`)
        .where(`${this.tableName}.${primaryKey}`, sqlOperator, queryIn)
        .select(`${foreignTableName}.*`);
    }
  }

  async fetchRelationship(
    key: string,
    relationship: ResourceSchemaRelationship,
    record: HasId,
    eagerLoadedData: EagerLoadedData
  ): Promise<KnexRecord | KnexRecord[] | void> {
    if (!eagerLoadedData[key]) {
      return;
    }

    if (relationship.belongsTo) {
      const relatedPrimaryKey = relationship.type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
      const foreignKeyName =
        relationship.foreignKeyName || this.appInstance.app.serializer.relationshipToColumn(key, relatedPrimaryKey);
      return eagerLoadedData[key].find(
        (eagerLoadedRecord: KnexRecord) => eagerLoadedRecord[relatedPrimaryKey] === record[foreignKeyName]
      );
    }

    if (relationship.hasMany) {
      const thisPrimaryKey = this.resourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
      const foreignKeyName =
        relationship.foreignKeyName ||
        this.appInstance.app.serializer.relationshipToColumn(this.resourceClass.type, thisPrimaryKey);
      return eagerLoadedData[key].filter(
        (eagerLoadedRecord: KnexRecord) => record[thisPrimaryKey] === eagerLoadedRecord[foreignKeyName]
      );
    }
  }
}
