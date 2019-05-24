export default {
  userToAuthenticate: {
    attributes: {
      email: "me@me.com",
      password: "mememe",
      username: "me"
    },
    type: "user",
    relationships: {}
  },
  forCreation: {
    request: {
      data: {
        attributes: {
          email: "test@test.com",
          password: "test",
          username: 123456
        },
        type: "user",
        relationships: {}
      }
    },
    response: {
      data: {
        id: 1,
        type: "user",
        attributes: {
          username: "123456",
          email: "test@test.com",
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"]
        },
        relationships: {}
      }
    }
  },
  toUpdate: {
    request: {
      data: {
        attributes: {
          email: "test@test.com",
          password: "test",
          username: 123456
        },
        type: "user",
        relationships: {}
      }
    },
    dataToUpdate: {
      data: {
        type: "user",
        attributes: {
          email: "modifiedemail@test.com"
        }
      }
    },
    response: {
      data: {
        id: 1,
        type: "user",
        attributes: {
          username: "123456",
          email: "modifiedemail@test.com",
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"]
        },
        relationships: {}
      }
    }
  },
  toAuthenticate: {
    user: {
      data: {
        attributes: {
          email: "test@test.com",
          password: "test",
          username: 123456
        },
        type: "user",
        relationships: {}
      }
    },
    request: {
      data: {
        attributes: {
          email: "test@test.com",
          password: "test"
        },
        type: "session"
      }
    },
    response: {
      data: {
        id: "STRING",
        type: "session",
        attributes: {
          token: "STRING"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user"
            }
          }
        }
      }
    }
  },
  toGet: [
    // the first element here is the authenticated user
    {
      id: 1,
      type: "user",
      attributes: {
        email: "me@me.com",
        username: "me",
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {}
    }
  ]
};
