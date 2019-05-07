import Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("users", table => {
    table.increments("id").primary();
    table.string("username");
    table.string("email");
    table.string("password");
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("users");
}
