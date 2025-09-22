const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

const { assetExts, sourceExts } = config.resolver;

if (!assetExts.includes('md')) {
  assetExts.push('md');
}

config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = sourceExts
  .filter((ext) => ext !== 'md')
  .concat(sourceExts.includes('svg') ? [] : ['svg']);

module.exports = config;
