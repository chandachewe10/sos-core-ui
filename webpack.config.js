const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Platform-specific implementations handled via .web.tsx and .native.tsx files
  // Add support for CSS imports (used by Leaflet)
  config.module.rules.push({
    test: /\.css$/i,
    use: ['style-loader', 'css-loader'],
  });

  return config;
};