exports.up = function (knex) {
  return Promise.all([
    knex.schema.hasTable("exchange_offices").then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("exchange_offices", function (table) {
          table.integer("id").notNullable().unique();
          table.string("name").notNullable();
          table.string("country").notNullable();
        });
      }
    }),
    knex.schema.hasTable("exchanges").then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("exchanges", function (table) {
          table.increments("id");
          table
            .integer("office_id")
            .unsigned()
            .references("id")
            .inTable("exchange_offices")
            .onDelete("CASCADE");
          table.string("from").notNullable();
          table.string("to").notNullable();
          table.float("ask").notNullable();
          table.timestamp("date").defaultTo(knex.fn.now());
        });
      }
    }),
    knex.schema.hasTable("rates").then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("rates", function (table) {
          table.increments("id");
          table
            .integer("office_id")
            .unsigned()
            .references("id")
            .inTable("exchange_offices")
            .onDelete("CASCADE");
          table.string("from").notNullable();
          table.string("to").notNullable();
          table.float("in").notNullable();
          table.float("out").notNullable();
          table.float("reserve").notNullable();
          table.timestamp("date").defaultTo(knex.fn.now());
        });
      }
    }),
    knex.schema.hasTable("countries").then(function (exists) {
      if (!exists) {
        return knex.schema.createTable("countries", function (table) {
          table.string("code").primary();
          table.string("name").notNullable();
        });
      }
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable("rates"),
    knex.schema.dropTable("exchanges"),
    knex.schema.dropTable("exchange_offices"),
    knex.schema.dropTable("countries"),
  ]);
};
