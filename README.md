# DiscordSidebarPriceBot
Discord bot for pulling cryptocurrency price data at intervals and displaying it in the users sidebar

## Dependencies
1. Install [Node.js](https://nodejs.org) version 18.3.0 or greater

## Setup
1. Run `npm install` to install all the node dependencies
2. Create and populate auth.json (auth.json.template provided), it goes in the same root directory level as index.js

## Run
`node index.js <ticker> <update interval (in milliseconds)> <token index (from auth.json)>`

The bot can also show ETH gas prices for slow, standard, and fast confirmation times in gwei. To do this, use `ETHEREUMGASTICKER` as the ticker rather than a coin ticker. See example below.

#### Examples:
`node index.js eth 60000 0`  &nbsp;(ETH price, updating every 60 seconds, using Discord bot token 0)<br>
`node index.js ETHEREUMGASTICKER 35000 0`  &nbsp;(Gas prices, updating every 35 seconds, using Discord bot token 0)
