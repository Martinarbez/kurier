import { HasId, KnexProcessor } from "../jsonapi-ts";
import User from "../resources/user";

export default class UserProcessor<RT = User> extends KnexProcessor<RT> {
  static resourceClass = User;

  attributes = {
    async friends() {
      return [{ name: "Joel" }, { name: "Ryan" }];
    },

    coolFactor(): number {
      return 3;
    }
  };

  // relationships = {
  //   async articles(this: UserProcessor<User>, user: HasId) {
  //     const processor = await this.processorFor("article");

  //     return await (processor as KnexProcessor)
  //       .getQuery()
  //       .where({ id: user.id })
  //       .select();
  //   }
  // };
}
