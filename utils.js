'use strict'

module.exports = {
  padString: padString,
  parseDiscordUserId: parseDiscordUserId,
  replaceDiscordMentionIdsWithNames: replaceDiscordMentionIdsWithNames,
  toTitleCase: toTitleCase,
  truncateStr: truncateStr
}

/**
 * Pads a string with characters. Used mainly for keeping table columns aligned for price and position displays
 * e.g we want the price column to always be a consistent width 
 *    ticker | price        | 24hr % chg
 * +     XMR | $60.17       | 0.1
 * +     BTC | $8868.77     | 0.55
 * @param {string} pad String we're padding with, usually a number of spaces, e.g. '       '
 * @param {string} str String that we're padding e.g. '60.17'
 * @param {boolean} padLeft If true, then padding is on the left of the string, otherwise it's on the right
 * @returns {string} The padded string e.g. '$60.17      '
*/
function padString(pad, str, padLeft) {
  if (typeof str === 'undefined') 
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

/**
 * See if a string matches a discord user identifier
 * @param {string} str String to check
 * @returns {string} The parsed discord id if a match is found, e.g. 676989462969974844, otherwise returns null if it ain't found
*/
function parseDiscordUserId(str) {
  let pattern = /<@![0-9]+>/g;
  let matches = str.match(pattern);
  if (matches) {
    return matches[0].split('<@!').join('').split('>').join('');
  }
  else {
    return null;
  }
}

function replaceDiscordMentionIdsWithNames(str, mentionsUsers) {
  for (let [userId, userObj] of mentionsUsers) {
    str = str.split('<@' + userId + '>').join('@' + userObj.username).split('<@!' + userId + '>').join('@' + userObj.username);
  }
  return str;
}

/**
 * Change a string to proper case, e.g. 'heya there' becomes 'Heya There'
 * @param {string} str String to check
 * @returns {string}
*/
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

function truncateStr(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + '...';
  }
  else {
    return str;
  }
}