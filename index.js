require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { parseData } = require("./util/convert.functions");
const { insertData } = require("./util/insert.functions");
const { topExchangers, topExchangersByQuery } = require("./util/api.request");
const db = require("./db/config");

const app = express();
const port = process.env.PORT || 4507;

// Middleware to parse JSON and text data
app.use(express.json());
app.use(express.text({ type: "text/plain" }));

// Route for importing data from the .txt file
app.get("/import", async (req, res) => {
  try {
    // Read the data from the .txt file
    const txtData = fs.readFileSync("dump.file.txt", "utf-8");

    // Convert the text data to JSON
    const jsonData = await parseData(txtData);

    // insert the JSON data into the database
    await insertData(jsonData);

    return res.status(200).json(jsonData);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while importing data" });
  }
});

// for show all data in db
app.get("/data", async (req, res) => {
  const exchange_offices = await db("exchange_offices").select("*");
  const exchanges = await db("exchanges").select("*");
  const rates = await db("rates").select("*");
  const countries = await db("countries").select("*");

  return res.status(200).json({
    exchange_offices,
    exchanges,
    rates,
    countries,
  });
});

app.get("/api/top_exchangers", async (req, res) => {
  const result = await topExchangers(res);

  res.status(200).json(result);
});

app.get("/api/top_exchangers_by_query", async (req, res) => {
  const result = await topExchangersByQuery(res);

  res.status(200).json(result);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
