/** ------------------------------------------------------------------------------------------------
 * 
 *                         _(`-')    (`-').-> _  (`-')<-.(`-')  
 *                        ( (OO ).-> ( OO)_   \-.(OO ) __( OO)  
 *                        \    .'_ (_)--\_)  _.'    \'-'---.\  
 *                         '`'-..__)/    _ / (_...--''| .-. (/  
 *                         |  |  ' |\_..`--. |  |_.' || '-' `.) 
 *                         |  |  / :.-._)   \|  .___.'| /`'.  | 
 *                         |  '-'  /\       /|  |     | '--'  / 
 *                         `------'  `-----' `--'     `------'  
 *  
 *      Program:  DiscordSidebarPriceBot (DSPB)
 *       Author:  Piper
 *                  Discord:  cucurbit
 *                   Reddit:  piper_cucu
 *                  Twitter:  @PiperCucu
 *                   GitHub:  pipercucu
 *
 *  Description:  Discord bot for pulling cryptocurrency price data at intervals and displaying it in the users sidebar
 * 
 *                                ♡ Made with love in Alabama, USA
 * -------------------------------------------------------------------------------------------------*/
'use strict'

const auth = require('./auth.json');
const coinGeckoCmds = require('./coinGeckoCmds.js');
const Discord = require('discord.js');
const http = require('http');

const bot = new Discord.Client();

let UPDATE_INTERVAL;  // Price update interval in milliseconds
let TICKER;           // Which ticker to pull price for
let TOKEN_INDEX;      // Discord bot token index to use (in auth.json)
let ROTATE_PRICE;     // If unpopulated, keep price as $, otherwise rotate between $, Ξ and ₿ every 10 seconds

let priceData;
let guildMeCache = [];

// Ready up activities
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity(`😀`);

  // Run the lookup loader
  coinGeckoCmds.loadLookupJson();

  bot.guilds.cache.each(guild => guildMeCache.push(guild.me));

  // Get ticker from args, default to ETH if unpopulated
  if (typeof process.argv[2] !== 'undefined') {
    TICKER = process.argv[2].toUpperCase();
  }
  else {
    TICKER = 'ETH'
  }

  // Get update interval from args, default to 1 minute if unpopulated
  if (typeof process.argv[3] !== 'undefined') {
    UPDATE_INTERVAL = process.argv[3];
  }
  else {
    UPDATE_INTERVAL = 60000;
  }

  // Rotate price between $, Ξ and ₿ every 10 seconds if populated
  if (typeof process.argv[5] !== 'undefined') {
    ROTATE_PRICE = true;
  }
  else {
    ROTATE_PRICE = false;
  }

  getPrice();
  setInterval(getPrice, UPDATE_INTERVAL);

  if (ROTATE_PRICE) {
    setInterval(showPrice, 10000);
  }
});

async function getPrice() {
  if (TICKER === 'ETHEREUMGASTICKER' || TICKER === '⛽') {
    getGas();
    return;
  }

  let data = await coinGeckoCmds.getPrice(ROTATE_PRICE ? [TICKER, 'ETH', 'BTC'] : [TICKER]);
  priceData = { showPriceType: '$' };
  let foundTokenKeys = Object.keys(data.found);
  foundTokenKeys.forEach(key => {
    let tokenData = data.found[key];

    if (TICKER === 'ETH' || TICKER === 'BTC') {
      priceData.ticker = TICKER
    } else {
      if (key !== 'ETH' && key !== 'BTC') {
        priceData.ticker = key;
      }
    }
    
    priceData[key] = {
      currPrice: tokenData.usd,
      pastPrice: tokenData.usd / ((100 + tokenData.usd_24h_change) / 100),
      change24H: Math.ceil(tokenData.usd_24h_change * 100) / 100,
      changeArrow: tokenData.usd_24h_change > 0 ? '(↗)' : (tokenData.usd_24h_change < 0 ? '(↘)' : '(→)')
    };
  });

  if (ROTATE_PRICE) {
    ['ETH', 'BTC'].forEach(comparison => {
      let currPrice = priceData[priceData.ticker].currPrice / priceData[comparison].currPrice;
      let pastPrice = priceData[priceData.ticker].pastPrice / priceData[comparison].pastPrice;
      let change24H = ((currPrice - pastPrice) / pastPrice * 100).toFixed(2);
      if (comparison === 'BTC' && currPrice < 0.00001) {
        currPrice = (currPrice * 100000000).toFixed(0) + 'sat';
      } else {
        currPrice = currPrice.toFixed(5);
      }
      priceData[priceData.ticker + comparison] = {
        currPrice: currPrice,
        pastPrice: pastPrice,
        change24H: change24H,
        changeArrow: change24H > 0 ? '(↗)' : (change24H < 0 ? '(↘)' : '(→)')
      };
    })
  }
  else {
    showPrice();
  }
}

function showPrice() {
  if (!priceData) {
    return;
  }

  let priceKey;
  let showPriceType = priceData.showPriceType + '';

  switch(priceData.showPriceType) {
    case '$':
      priceKey = priceData.ticker;
      if (ROTATE_PRICE) {
        priceData.showPriceType = 'Ξ';
      }
      break;
    case 'Ξ':
      priceKey = priceData.ticker + 'ETH';
      priceData.showPriceType = '₿';
      break;
    case '₿':
      priceKey = priceData.ticker + 'BTC';
      priceData.showPriceType = '$';
      break;
    default:
      break
  }

  if (!(priceData.ticker === 'ETH' && showPriceType === 'Ξ') && !(priceData.ticker === 'BTC' && showPriceType === '₿')) {
    guildMeCache.forEach(guildMe => guildMe.setNickname(`${priceData.ticker} ${showPriceType}${priceData[priceKey].currPrice} ${priceData[priceKey].changeArrow}`));
    bot.user.setActivity(`${showPriceType} 24h: ${priceData[priceKey].change24H}%`);
    //console.log(`${priceData.ticker} $${priceData[priceKey].currPrice} ${priceData[priceKey].change24H}%`);
  }
}

function getGas() {
  http.get(`http://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${auth.etherscanToken}`, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    // Any 2xx status code signals a successful response but
    // here we're only checking for 200.
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      // Consume response data to free up memory
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        guildMeCache.forEach(guildMe => guildMe.setNickname(`⚡${parsedData.result.FastGasPrice} gwei`));
        bot.user.setActivity(`🚶${parsedData.result.ProposeGasPrice} 🐢${parsedData.result.SafeGasPrice}`);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

// Get token index from args, default to 0
if (typeof process.argv[4] !== 'undefined') {
  TOKEN_INDEX = process.argv[4];
}
else {
  TOKEN_INDEX = 0;
}

bot.login(auth.discordBotTokens[TOKEN_INDEX]);