const db = require("../db/config"); // Your db configuration file

const insertData = async (data) => {
  // Insert countries first
  await db("countries").insert(
    data.countries.map((country) => ({
      code: country.country.code,
      name: country.country.name,
    }))
  );

  const insertOffices = data["exchange-offices"].map(async (office) => {
    await db("exchange_offices").insert({
      id: office["exchange-office"].id,
      name: office["exchange-office"].name,
      country: office["exchange-office"].country,
    });

    (await !office["exchange-office"]?.rates?.length)
      ? []
      : office["exchange-office"].rates.map(async (rate) => {
          await db("rates").insert({
            from: rate.rate.from,
            to: rate.rate.to,
            in: rate.rate.in,
            out: rate.rate.out,
            reserve: rate.rate.reserve,
            date: rate.rate.date,
            office_id: office["exchange-office"].id,
          });
        });

    if (!office["exchange-office"]?.exchanges?.length) {
      return;
    }

    await office["exchange-office"].exchanges.map(async (exchange) => {
      await db("exchanges").insert({
        from: exchange.exchange.from,
        to: exchange.exchange.to,
        ask: exchange.exchange.ask,
        date: exchange.exchange.date,
        office_id: office["exchange-office"].id,
      });
    });
  });
  await Promise.all(insertOffices);
};

module.exports = { insertData };
