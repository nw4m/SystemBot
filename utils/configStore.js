const fs   = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

let cache     = null;
let cacheTime = 0;
const TTL     = 2000;

function read() {
  const now = Date.now();
  if (cache && now - cacheTime < TTL) return cache;
  try {
    cache     = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    cacheTime = now;
  } catch {
    if (!cache) cache = {};
  }
  return cache;
}

function write(data) {
  const tmp = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, CONFIG_PATH);
  cache     = data;
  cacheTime = Date.now();
}

function invalidate() {
  cache     = null;
  cacheTime = 0;
}

module.exports = { read, write, invalidate, CONFIG_PATH };
