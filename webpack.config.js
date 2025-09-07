const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add fallback for react-native-maps on web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-maps': 'react-native-web-maps',
  };
  
  return config;
};