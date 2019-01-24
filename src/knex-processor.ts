import * as Knex from "knex";

import OperationProcessor from "./operation-processor";
import Resource from "./resource";
import { KnexRecord, Operation, ResourceConstructor } from "./types";

export default class KnexProcessor<
  ResourceT extends ResourceConstructor
> extends OperationProcessor<ResourceT> {
  private knex: Knex;

  constructor(public knexOptions = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  private convertToResources(type: string, records: KnexRecord[]) {
    return records.map(record => {
      const id = record["id"];
      delete record["id"];
      const attributes = record;
      const resourceClass: ResourceConstructor = this.resourceFor(type);

      return new resourceClass({ id, attributes });
    });
  }

  async get(type: string, filters = {}): Promise<Resource[]> {
    const tableName = this.typeToTableName(type);

    const records: KnexRecord[] = await this.knex(tableName)
      .where(this.filtersToKnex(filters))
      .select();

    return this.convertToResources(type, records);
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(data: Resource): Promise<Resource> {
    const tableName = this.typeToTableName(data.type);

    await this.knex(tableName)
      .where({ id: data.id })
      .update(data.attributes);

    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id: data.id })
      .select();

    return this.convertToResources(data.type, records)[0];
  }

  async add(data: Resource): Promise<Resource> {
    const tableName = this.typeToTableName(data.type);

    const [id] = await this.knex(tableName).insert(data.attributes);
    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(data.type, records)[0];
  }

  private typeToTableName(type: string): string {
    return type;
  }

  private filtersToKnex(filters: {}): {} {
    return filters;
  }
}
