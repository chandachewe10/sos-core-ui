const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      "inline-dotenv" 
    ],
    overrides: [
      {
        test: (fileName) => {
          return (
            !fileName.includes(path.join("node_modules", "react-native-maps"))
          );
        },
        plugins: [
          ["@babel/plugin-transform-class-properties", { loose: true }],
          ["@babel/plugin-transform-private-methods", { loose: true }],
          ["@babel/plugin-transform-private-property-in-object", { loose: true }],
        ],
      },
    ],
  };
};
