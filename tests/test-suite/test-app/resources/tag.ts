import Article from "./article";
import { Resource } from "../kurier";

export default class Tag extends Resource {
  static schema = {
    primaryKeyName: "id",
    attributes: {
      name: String,
    },
    relationships: {
      articles: {
        type: () => Article,
        foreignKeyName: "article_id",
        manyToMany: true,
        intermediateTable: "articles_tags"
      },
    },
  };
}
