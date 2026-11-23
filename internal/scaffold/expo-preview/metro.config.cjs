const path = require('node:path');
const { createRequire } = require('node:module');

const projectRoot = process.cwd();
const fromProject = createRequire(path.join(projectRoot, 'package.json'));
const fromExpo = createRequire(fromProject.resolve('expo/package.json'));
const fromMetro = createRequire(fromExpo.resolve('@expo/metro-config/package.json'));
const { getDefaultConfig } = fromProject('expo/metro-config');
const { mergeConfig, resolveConfig } = fromMetro('@expo/metro/metro-config');

module.exports = (async () => {
  const defaults = getDefaultConfig(projectRoot);
  const { config: projectConfig } = await resolveConfig(undefined, projectRoot);
  const config = mergeConfig(defaults, typeof projectConfig === 'function' ? await projectConfig(defaults) : projectConfig);

  // 保留项目现有的 Babel 转换器和 NativeWind 配置，由临时转换器委托执行。
  process.env.BUILDUI_EXPO_BABEL_TRANSFORMER = config.transformer.babelTransformerPath;
  return {
    ...config,
    transformer: { ...config.transformer, babelTransformerPath: require.resolve('./transformer.cjs') },
    serializer: {
      ...config.serializer,
      // Expo SDK 54 会替换 Web 的 getPolyfills，Metro 仍会加载 polyfillModuleNames。
      polyfillModuleNames: [...config.serializer.polyfillModuleNames, path.join(__dirname, 'preview-inspector.js')],
    },
  };
})();
