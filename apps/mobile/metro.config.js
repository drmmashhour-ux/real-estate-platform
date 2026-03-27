const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};
config.watchFolders = [path.resolve(projectRoot)];
module.exports = config;
