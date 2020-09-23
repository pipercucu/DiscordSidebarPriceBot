'use strict'
const fs = require('fs');
const coinGeckoLookups = require('./common/coinGeckoLookups.json')
const CoinGecko = require('coingecko-api');
const utils = require('./utils.js');

const CoinGeckoClient = new CoinGecko();

module.exports = {
  getPrice: getPrice,
  loadLookupJson: loadLookupJson
}

/**
 * Gets price for a given search term https://www.coingecko.com/api/documentations/v3#/simple/get_simple_price
 * @param {Array} searchTerms Array of either be a ticker symbol(s) or the name(s) of a coin(s)
*/
async function getPrice(searchTerms) {
  searchTerms = searchTerms || ['BTC'];
  searchTerms = searchTerms.map(function(searchTerm){ return searchTerm.toUpperCase() });

  let foundSearchTerms = {};
  let unfoundSearchTerms = [];
  let tokenApiIds = [];

  searchTerms.forEach(searchTerm => {
    let searchResult = coinGeckoLookups[searchTerm];
    if (searchResult && searchResult.value.length > 0) {
      let foundSearchTerm = {};
      if (searchResult.isTicker) {
        foundSearchTerm.tokenName = searchResult.value[0];
        foundSearchTerm.tokenApiId = searchResult.apiIds[0];
        foundSearchTerm.tokenTicker = searchTerm;
      }
      else {
        foundSearchTerm.tokenName = searchTerm;
        foundSearchTerm.tokenApiId = searchResult.apiIds[0];
        foundSearchTerm.tokenTicker = searchResult.value[0];
      }
      tokenApiIds.push(foundSearchTerm.tokenApiId);
      foundSearchTerms[foundSearchTerm.tokenApiId] = foundSearchTerm;
    }
    else {
      unfoundSearchTerms.push(searchTerm.toLowerCase());
    }
  });

  let data = await CoinGeckoClient.simple.price({
    ids: tokenApiIds,
    vs_currencies: ['usd'],
    include_market_cap: [true],
    include_24hr_vol: [true],
    include_24hr_change: [true],
    include_last_updated_at: [true]
  });

  let tokenData = data['data'];
  let tokenDataKeys = Object.keys(tokenData);

  tokenDataKeys.forEach(key => {
    let tokenTicker = foundSearchTerms[key].tokenTicker;
    foundSearchTerms[tokenTicker] = tokenData[key];
    foundSearchTerms[tokenTicker].name = utils.toTitleCase(foundSearchTerms[key].tokenName);
    foundSearchTerms[tokenTicker].ticker = tokenTicker;
    delete foundSearchTerms[key];
  });

  return { found: foundSearchTerms, unfound: unfoundSearchTerms };
}

/**
 * Parses https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list into a lookup object
 * so we can get the coin name from the ticker and vice versa.
*/
async function loadLookupJson() {
  let data = await CoinGeckoClient.coins.list();
  let lookupObj = {};
  // For each token, make key value pairs to match ticker symbols to names and vice versa
  // For symbol lookups, the key is the ticker symbol and the value is an array of all names that share that ticker.
  // For name lookups, it's the opposite.
  // Each key value pair also has a boolean telling y'all whether it's a ticker or name lookup.
  for (const token of data.data) {
    let tokenSymbol = token.symbol.toUpperCase();
    let tokenName = token.name;
    let tokenApiId = token.id;
    if (lookupObj.hasOwnProperty(tokenSymbol)) {
      lookupObj[tokenSymbol].apiIds.push(tokenApiId);
      lookupObj[tokenSymbol].value.push(tokenName.toUpperCase());
    }
    else {
      lookupObj[tokenSymbol] = {
        isTicker: true,
        apiIds:[tokenApiId],
        value: [tokenName.toUpperCase()]
      };
    }

    if (lookupObj.hasOwnProperty(tokenName.toUpperCase())) {
      lookupObj[tokenName.toUpperCase()].value.push(tokenSymbol);
    }
    else {
      lookupObj[tokenName.toUpperCase()] = {
        isTicker: false,
        apiIds:[tokenApiId],
        value: [tokenSymbol]
      };
    }
  }
  fs.writeFile("./common/coinGeckoLookups.json", JSON.stringify(lookupObj), function(err) {
    if (err) {
      return console.log(err);
    }
  });
  console.log("CoinGecko lookups loaded to ./common/coinGeckoLookups.json");
};

require('make-runnable');