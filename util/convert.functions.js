const fs = require("fs");

const parseData = (data) => {
  let parsedData = {};

  const countryIndex = data.indexOf("countries");
  const exchangeOfficesData = data.slice(0, countryIndex);
  const countriesData = data.slice(countryIndex + 1);

  parsedData["exchange-offices"] =
    parseExchangeOffices(exchangeOfficesData) ?? [];
  parsedData.countries = parseCountries(countriesData) ?? [];

  return parsedData;
};

const parseCountries = (section) => {
  const lines = section.split("\n");
  const countries = [];
  let currentCountry = null;

  for (let line of lines) {
    if (line.trim().startsWith("country")) {
      if (currentCountry) {
        countries.push({ country: currentCountry });
      }
      currentCountry = {};
    } else if (line.includes("=")) {
      // Direct properties of country
      const [key, value] = line.trim().split(" = ");
      currentCountry[key] = value;
    }
  }
  if (currentCountry) {
    countries.push({ country: currentCountry });
  }

  return countries;
};

const parseExchangeOffices = (section) => {
  const lines = section.split("\n");
  let exchangeOffices = [];
  let currentExchangeOffice = null;
  let currentSubObj = null;

  for (let line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("exchange-office")) {
      if (currentExchangeOffice) {
        exchangeOffices.push(currentExchangeOffice);
      }
      currentExchangeOffice = { "exchange-office": {} };
    } else if (trimmedLine.startsWith("exchange")) {
      currentSubObj = {};
      if (!currentExchangeOffice["exchange-office"].exchanges) {
        currentExchangeOffice["exchange-office"].exchanges = [];
      }
      currentExchangeOffice["exchange-office"].exchanges.push({
        exchange: currentSubObj,
      });
    } else if (trimmedLine.startsWith("rate")) {
      currentSubObj = {};
      if (!currentExchangeOffice["exchange-office"].rates) {
        currentExchangeOffice["exchange-office"].rates = [];
      }
      currentExchangeOffice["exchange-office"].rates.push({
        rate: currentSubObj,
      });
    } else if (trimmedLine.includes("=")) {
      const [key, value] = trimmedLine.split(" = ");

      if (key === "id") {
        currentExchangeOffice["exchange-office"][key] = parseInt(value, 10);
      } else if (key === "name" || key === "country") {
        currentExchangeOffice["exchange-office"][key] = value;
      } else if (currentSubObj) {
        currentSubObj[key] = ["ask", "in", "out", "reserve"].includes(key)
          ? parseFloat(value)
          : value;
      }
    }
  }

  if (currentExchangeOffice) {
    exchangeOffices.push(currentExchangeOffice);
  }

  return removeEmptyObjects(exchangeOffices);
};

const removeEmptyObjects = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj; // Return non-object or null objects unchanged

  if (Array.isArray(obj))
    return obj
      .map(removeEmptyObjects)
      .filter(
        (item) => !(typeof item === "object" && Object.keys(item).length === 0)
      );

  let cleanedObj = {};
  for (let key in obj) {
    let value = removeEmptyObjects(obj[key]);
    if (!(typeof value === "object" && Object.keys(value).length === 0))
      cleanedObj[key] = value;
  }
  return cleanedObj;
};

const test = parseData(fs.readFileSync("dump.file.txt", "utf-8"));

module.exports = {
  parseData,
};
