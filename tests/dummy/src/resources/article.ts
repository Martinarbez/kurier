import { Resource } from "../jsonapi-ts";
import User from "./user";
import Vote from "./vote";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String
    },

    relationships: {
      author: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: 'authorId'
      },
      votes: {
        type: () => Vote,
        hasMany: true,
        foreignKeyName: 'article_id'
      }
    }
  };
}
