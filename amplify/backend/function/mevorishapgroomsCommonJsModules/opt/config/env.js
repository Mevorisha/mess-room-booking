const env = require("../env.json");
const envSecrets = require("../env.secrets.json");

// expand env, and overwrite secret properties from envSecrets
module.exports = { ...env, ...envSecrets };
