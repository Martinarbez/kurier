import { HasId, KnexProcessor } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor extends KnexProcessor<Article> {
  static async shouldHandle(resourceType: string): Promise<boolean> {
    return resourceType === Article.type;
  }

  relationships = {
    async author(this: ArticleProcessor, article: HasId) {
      const processor = await this.processorFor("user");

      return await (processor as KnexProcessor)
        .getQuery()
        .where({ id: article.authorId })
        .select();
    }
  };
}
