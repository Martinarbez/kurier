export const articles = [
  {
    id: 1,
    type: "article",
    attributes: {
      body: "this is test 1",
      voteCount: 2,
    },
    relationships: {
      author: {
        data: {
          id: 1,
          type: "user",
        },
      },
    },
  },
  {
    id: 2,
    type: "article",
    attributes: {
      body: "this is test 2",
      voteCount: 0,
    },
    relationships: {
      author: {
        data: {
          id: 2,
          type: "user",
        },
      },
    },
  },
  {
    id: 3,
    type: "article",
    attributes: {
      body: "this is test 3",
      voteCount: 1,
    },
    relationships: {
      author: {
        data: {
          id: 2,
          type: "user",
        },
      },
    },
  },
];

export default {
  toGet: {
    response: [
      {
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 1, type: "user" },
          },
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 2,
        attributes: {
          body: "this is test 2",
          voteCount: 0,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" },
          },
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 3,
        attributes: {
          body: "this is test 3",
          voteCount: 1,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" },
          },
        },
        meta: {
          hello: "world",
        },
      },
    ],
  },
  singleArticleMultipleIncludes: {
    data: {
      id: 1,
      type: "article",
      attributes: {
        body: "this is test 1",
        voteCount: 2,
      },
      meta: {
        hello: "world",
      },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user",
          },
        },
        votes: {
          data: [
            {
              id: 1,
              type: "vote",
            },
            {
              id: 2,
              type: "vote",
            },
          ],
        },
      },
    },
    included: [
      {
        id: 1,
        type: "user",
        attributes: {
          username: "me",
          email: "me@me.com",
          location: {
            lat: -10.24,
            lng: -10.25,
          },
          coolFactor: 3,
          friends: [
            {
              name: "Joel",
            },
            {
              name: "Ryan",
            },
          ],
          roles: ["user", "author", "voter"],
        },
        relationships: {},
      },
      {
        id: 1,
        type: "vote",
        attributes: {
          points: 10,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
    ],
  },
  fistArticleWithTagsIncluded: {
    data: {
      id: 1,
      type: "article",
      attributes: {
        body: "this is test 1",
        voteCount: 2,
      },
      meta: {
        hello: "world",
      },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user",
          },
        },
        tags: {
          data: [
            {
              id: 1,
              type: "tag",
            },
          ],
        },
      },
    },
    included: [
      {
        id: 1,
        type: "tag",
        attributes: {
          name: "News",
        },
        relationships: {},
      },
    ],
  },
  multipleArticlesIncludedVotes: {
    data: [
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        relationships: {
          votes: {
            data: [
              {
                id: 1,
                type: "vote",
              },
              {
                id: 2,
                type: "vote",
              },
            ],
          },
          author: {
            data: {
              id: 1,
              type: "user",
            },
          },
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 2,
        type: "article",
        attributes: {
          body: "this is test 2",
          voteCount: 0,
        },
        relationships: {
          votes: {
            data: [],
          },
          author: {
            data: {
              id: 2,
              type: "user",
            },
          },
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 3,
        type: "article",
        attributes: {
          body: "this is test 3",
          voteCount: 1,
        },

        relationships: {
          votes: {
            data: [
              {
                id: 3,
                type: "vote",
              },
            ],
          },
          author: {
            data: {
              id: 2,
              type: "user",
            },
          },
        },
        meta: {
          hello: "world",
        },
      },
    ],
    included: [
      {
        id: 1,
        type: "vote",
        attributes: {
          points: 10,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
      {
        id: 3,
        type: "vote",
        attributes: {
          points: 8,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 3,
              type: "user",
            },
          },
          article: {
            data: {
              id: 3,
              type: "article",
            },
          },
        },
      },
    ],
  },
};
