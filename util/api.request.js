const db = require("../db/config");
const Decimal = require("decimal.js");

const topExchangers = async () => {
  const currentDate = new Date(); // current date
  const lastYearDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - 1)
  );

  const rates = await db("rates").where("date", ">", lastYearDate).select("*");
  const exchanges = await db("exchanges")
    .where("date", ">", lastYearDate)
    .select("*");
  const offices = await db("exchange_offices").select("*");

  const profitsByOfficeId = {};

  for (const exchange of exchanges) {
    const { ask, from, to, office_id } = exchange;
    const rate = rates.find(
      (rate) =>
        rate.from === from && rate.to === to && rate.office_id === office_id
    );
    if (!rate) continue;

    // needed for calculating profit
    const reverseExchange = rates.findLast(
      (reverseRate) =>
        reverseRate.to === rate.from && reverseRate.from === rate.to
    );

    if (!reverseExchange) continue;
    const primaryOperation = new Decimal(ask).times(new Decimal(rate.in));

    const reverseOperation = new Decimal(ask).times(
      new Decimal(reverseExchange.out)
    );

    let transactionProfit = new Decimal(primaryOperation)
      .minus(reverseOperation)
      .dividedBy(rate.in);

    // If the transaction currency is not USD, convert the profit to USD.
    if (to !== "USD") {
      const toUsdRate = rates.find(
        (rate) =>
          rate.from === to && rate.to === "USD" && rate.office_id === office_id
      );
      if (!toUsdRate) continue; // Skip if no conversion rate to USD is found.
      transactionProfit = transactionProfit.times(new Decimal(toUsdRate.in));
    }

    // Accumulate profits for each office
    if (profitsByOfficeId[office_id]) {
      profitsByOfficeId[office_id] =
        profitsByOfficeId[office_id].plus(transactionProfit);
    } else {
      profitsByOfficeId[office_id] = transactionProfit;
    }
  }

  const exchangersWithProfit = offices.map((office) => {
    const profit = profitsByOfficeId[office.id] || new Decimal(0);
    return {
      ...office,
      totalProfit: +profit,
    };
  });

  // Sort by totalProfit in descending order
  exchangersWithProfit.sort((a, b) =>
    new Decimal(b.totalProfit).cmp(new Decimal(a.totalProfit))
  );

  const topExchangersByCountry = exchangersWithProfit.reduce(
    (acc, exchanger) => {
      const country = exchanger.country;
      if (!acc[country]) acc[country] = [];
      acc[country].push(exchanger);
      return acc;
    },
    {}
  );

  return topExchangersByCountry;
};

const topExchangersByQuery = async () => {
  const getTop = await db.raw(`
        WITH exchange_in_usd AS (
          SELECT
              transaction.id,
              transaction_office.country,
              transaction_office.name AS exchanger_name,
              transaction.date,
              transaction.from,
              transaction.to,
              transaction.ask,
              transaction.ask / NULLIF(transaction_rate.out, 0) AS bid,
              CASE
                  WHEN transaction.from = 'USD' THEN transaction.ask
                  WHEN transaction.to = 'USD' THEN transaction.ask / NULLIF(transaction_rate.out, 0)
                  ELSE transaction.ask / NULLIF(r_from_usd.out, 0)
              END AS ask_usd,
              CASE
                  WHEN transaction.from = 'USD' THEN transaction.ask / NULLIF(transaction_rate.out, 0)
                  WHEN transaction.to = 'USD' THEN transaction.ask
                  ELSE transaction.ask / NULLIF(r_to_usd.out, 0)
              END AS bid_usd,
              CASE
                  WHEN transaction.from = 'USD' THEN transaction.ask / NULLIF(transaction_rate.out, 0)
                  ELSE transaction.ask / NULLIF(transaction_rate.in, 0)
              END AS initial_from,
              CASE
                  WHEN transaction.from = 'USD' THEN transaction.ask / NULLIF(transaction_rate.out, 0)
                  WHEN r_from_usd.out IS NOT NULL THEN (transaction.ask / NULLIF(transaction_rate.in, 0)) * r_from_usd.out
              END AS initial_from_usd
          FROM
              exchanges transaction
              INNER JOIN exchange_offices transaction_office ON transaction.office_id = transaction_office.id
              INNER JOIN rates transaction_rate ON transaction_rate.from = transaction.from AND transaction_rate.to = transaction.to AND transaction_rate.office_id = transaction_office.id AND transaction_rate.date <= transaction.date
              LEFT JOIN rates r_from_usd ON r_from_usd.to = transaction.from AND r_from_usd.from = 'USD' AND r_from_usd.office_id = transaction_office.id AND r_from_usd.date <= transaction.date
              LEFT JOIN rates r_to_usd ON r_to_usd.from = transaction.to AND r_to_usd.to = 'USD' AND r_to_usd.office_id = transaction_office.id AND r_to_usd.date <= transaction.date
          ORDER BY
              transaction_rate.date DESC, r_from_usd.date DESC, r_to_usd.date DESC
      ),
      profits AS (
          SELECT
              country,
              exchanger_name,
              SUM(bid_usd - initial_from_usd) AS total_profit
          FROM
              exchange_in_usd
          GROUP BY
              country, exchanger_name
      )
      SELECT
          country,
          exchanger_name,
          total_profit
      FROM (
          SELECT
              country,
              exchanger_name,
              total_profit,
              RANK() OVER (PARTITION BY country ORDER BY total_profit DESC) as rank
          FROM
              profits
      ) AS ranked
      WHERE
          rank <= 3
      ORDER BY
          total_profit DESC
      LIMIT 9;
    `);

  return getTop.rows[0];
};

module.exports = {
  topExchangers,
  topExchangersByQuery,
};
