import { KnexProcessor } from "../../jsonapi-ts";
import User from "./resource";

const timeout = (data, time) => new Promise(resolve => setTimeout(() => resolve(data), time));

export default class UserProcessor extends KnexProcessor<User> {
  static resourceClass = User;

  attributes = {
    async friends(user: User) {
      return await timeout([
        {name: 'Joel'},
        {name: 'Ryan'},
      ], 2000);
    },

    coolFactor(): number {
      return 3;
    }
  }

  relationships = {
    async posts(this: UserProcessor, user: any) {
      if (user.posts !== undefined) {
        console.log('Loading Already Done!');
        return user.posts;
      }

      console.log('Loading Async');

      return await this.knex('articles')
        .where({ authorId: user.id })
        .select();
    }
  }
}
