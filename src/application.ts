import flatten = require("flatten");
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  Operation,
  OperationResponse,
  ResourceRelationshipData,
  Links
} from "./types";
import pick from "./utils/pick";
import unpick from "./utils/unpick";
import { finished } from "stream";

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  user: Resource;
  services: { [key: string]: any };

  constructor(settings: {
    namespace?: string;
    types?: typeof Resource[];
    processors?: typeof OperationProcessor[];
    defaultProcessor?: typeof OperationProcessor;
    services?: {};
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || {};
    this.defaultProcessor = settings.defaultProcessor || OperationProcessor;
  }

  async executeOperations(ops: Operation[]): Promise<OperationResponse[]> {
    return await this.createTransaction(
      ops
        .map(async op => {
          const processor = await this.processorFor(op.ref.type);

          if (processor) {
            return this.executeOperation(op, processor);
          }
        })
        .filter(Boolean)
    );
  }

  async executeOperation(
    op: Operation,
    processor: OperationProcessor<Resource>
  ): Promise<OperationResponse> {
    const result = await processor.execute(op);
    return this.buildOperationResponse(result);
  }

  async createTransaction(ops: Promise<OperationResponse>[]) {
    return await Promise.all(ops);
  }

  async processorFor(
    resourceType: string
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async processor =>
        (await processor.shouldHandle(resourceType)) ? processor : false
      )
    );

    const processor = processors.find(p => p !== false);

    if (processor) {
      return new processor(this);
    }

    class ResourceProcessor extends this.defaultProcessor<Resource> {
      static resourceClass = resourceClass;
    }

    return new ResourceProcessor(this);
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    return this.types.find(({ type }) => type && type === resourceType);
  }

  async buildOperationResponse(
    data: Resource | Resource[] | void
  ): Promise<OperationResponse> {
    const included = flatten(await this.extractIncludedResources(data))
    const uniqueIncluded = Array.from(new Set(included
      .map((item: Resource) => `${item.type}_${item.id}`)))
      .map(uniqueTypeId => included
        .find((item: Resource) => (`${item.type}_${item.id}` === uniqueTypeId)))



    return included.length ?
      { included: uniqueIncluded, data: this.serializeResources(data) } :
      { data: this.serializeResources(data) };
  }

  serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(record => this.serializeResources(record));
    }

    Object.keys(data.relationships).forEach(relationshipName => {
      const relationships = this.serializeRelationship((data.relationships[
        relationshipName
      ] as unknown) as Resource | Resource[]);

      if (relationships.length) {
        data.relationships[relationshipName] = {
          data: relationships,
          links: {} as Links
        };
      } else {
        data.relationships[relationshipName] = relationships;
      }
    });

    return data;
  }

  serializeRelationship(relationships: Resource | Resource[]) {
    if (Array.isArray(relationships)) {
      return relationships.map(relationship =>
        this.serializeRelationship(relationship)
      );
    }

    return pick(relationships, ["id", "type"]);
  }

  async extractIncludedResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return Promise.all(
        data.map(record => this.extractIncludedResources(record))
      );
    }

    const resourceClass = await this.resourceFor(data.type);
    const schemaRelationships = resourceClass.schema.relationships;

    Object.keys(data.relationships).forEach(relationshipName => {
      if (Array.isArray(data.relationships[relationshipName])) {
        data.relationships[relationshipName] =
          (data.relationships[relationshipName] as any).map(rel => {
            rel["type"] = schemaRelationships[relationshipName].type().type;
            return rel;
          });
      } else {
        data.relationships[relationshipName]["type"] = schemaRelationships[
          relationshipName
        ].type().type;
      }
    });

    const rawInclude = await Promise.all(
      Object.values(data.relationships).map(async relatedResource => {
        if (Array.isArray(relatedResource)) {
          return Promise.all(
            relatedResource.map(async relResource => {
              const relatedResourceClass = await this.resourceFor(
                relResource["type"]
              );
              const resource = relResource[0] || relResource;

              if (!resource["id"]) {
                return;
              }

              return new relatedResourceClass({
                id: resource["id"],
                attributes: unpick(resource, ["id", "type"])
              });
            })
          );
        }

        const relatedResourceClass = await this.resourceFor(
          relatedResource["type"]
        );
        const resource = relatedResource[0] || relatedResource;

        if (!resource["id"]) {
          return;
        }

        return new relatedResourceClass({
          id: resource["id"],
          attributes: unpick(resource, ["id", "type"])
        });
      })
    );
    const validIncluded = flatten(rawInclude.filter(Boolean));
    return Array.from(
      new Set(validIncluded.map((item: Resource) => `${item.type}_${item.id}`))
    ).map(uniqueTypeId =>
      validIncluded.find((item: Resource) => (`${item.type}_${item.id}` === uniqueTypeId)));
  }
}
