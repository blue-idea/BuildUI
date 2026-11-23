const { name, version } = require('./package.json');

module.exports = {
  name,
  slug: name,
  version,
  platforms: ['ios', 'android', 'web'],
  userInterfaceStyle: 'automatic',
  web: { bundler: 'metro' },
};
