# DiscordSidebarPriceBot
Discord bot for pulling cryptocurrency price data at intervals and displaying it in the users sidebar

## Dependencies
1. Install Node.js version 18.3.0 or greater

## Setup
1. Run `npm install` to install all the node dependencies
2. Create and populate auth.json (auth.json.template provided), it goes in the same directory level as index.js

## Run
`node index.js <ticker> <update interval (in milliseconds)> <token index (from auth.json)>`
e.g.
`node index.js eth 60000 0`