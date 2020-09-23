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
const fs = require('fs');

const bot = new Discord.Client();

let UPDATE_INTERVAL;
let TICKER;
let TOKEN_INDEX;

// Ready up activities
bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity(`😀`);

  // Run the lookup loader
  coinGeckoCmds.loadLookupJson();

  // Get ticker from args, default to ETH if unpopulated
  if (typeof process.argv[2] !== 'undefined') {
    TICKER = process.argv[2].toUpperCase();
  }
  else {
    TICKER = 'ETH'
  }

  // Get update interval from args, default to ETH if unpopulated
  if (typeof process.argv[3] !== 'undefined') {
    UPDATE_INTERVAL = process.argv[3];
  }
  else {
    UPDATE_INTERVAL = 30000;
  }

  getPrice();
  setInterval(getPrice, UPDATE_INTERVAL);
});

async function getPrice() {
  let data = await coinGeckoCmds.getPrice([TICKER]);
  let currPrice = data.found[TICKER].usd;
  let change24H = Math.ceil(data.found[TICKER].usd_24h_change * 100) / 100;
  let changeArrow = change24H > 0 ? '(↗)' : (change24H < 0 ? '(↘)' : '(→)');
  bot.user.setActivity(`24h: ${change24H}%`);
  bot.guilds.cache.each(guild => guild.me.setNickname(`${TICKER} $${currPrice} ${changeArrow}`));
  console.log(`${TICKER} $${currPrice} ${change24H}%`);
}

// Get token index from args, default to 0
if (typeof process.argv[4] !== 'undefined') {
  TOKEN_INDEX = process.argv[4];
}
else {
  TOKEN_INDEX = 0;
}

bot.login(auth.discordBotTokens[TOKEN_INDEX]);