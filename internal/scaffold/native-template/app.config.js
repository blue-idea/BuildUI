const { name, version } = require('./package.json');

module.exports = {
  name,
  slug: name,
  version,
  platforms: ['ios', 'android', 'web'],
  userInterfaceStyle: 'automatic',
  scheme: `buildui-${name}`,
  plugins: ['expo-router'],
  web: { bundler: 'metro' },
};
