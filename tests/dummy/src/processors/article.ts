import { KnexProcessor, HasId } from "../jsonapi-ts";
import Article from "../resources/article";
import Vote from "../resources/vote";

export default class ArticleProcessor<ResourceT extends Article> extends KnexProcessor<ResourceT> {
  static resourceClass = Article;

  attributes = {
    async voteCount(this: ArticleProcessor<Article>, article: HasId) {
      const processor = <KnexProcessor<Vote>>await this.processorFor("vote");

      const [result] = await processor
        .getQuery()
        .where({ article_id: article.id })
        .count();

      return result["count(*)"];
    }
  };
  // relationships = {
  //   async author(this: ArticleProcessor<Article>, article: HasId) {
  //     const processor = await this.processorFor("user");

  //     const result = await (processor as KnexProcessor)
  //       .getQuery()
  //       .where({ id: article.authorId })
  //       .select();

  //     return result;
  //   }
  // };
}
