const path = require('node:path');
const { createRequire } = require('node:module');

const entry = process.argv[1]?.replaceAll('\\', '/') ?? '';
if (entry.endsWith('/next/dist/server/lib/start-server.js')
  || (entry.endsWith('/next/dist/bin/next') && process.argv[2] === 'dev')) {
  attachPreviewConfig();
}

function attachPreviewConfig() {
  // Next CLI 的配置读取点是版本适配边界。只增强开发阶段的有效配置，保留项目自己的配置与函数。
  const requireProject = createRequire(path.join(process.cwd(), 'package.json'));
  const { PHASE_DEVELOPMENT_SERVER } = requireProject('next/constants');
  const configModule = requireProject.resolve('next/dist/server/config');
  const exports = requireProject(configModule);
  const loadConfig = exports.default;
  const tagger = path.join(__dirname, 'tagger.cjs');
  require.cache[configModule].exports = {
    __esModule: true,
    ...exports,
    default: async function loadPreviewConfig(phase, dir, options) {
      const config = await loadConfig(phase, dir, options);
      if (phase !== PHASE_DEVELOPMENT_SERVER || options?.rawConfig) return config;
      const projectRoot = path.resolve(dir);
      const loader = { loader: tagger, options: { projectRoot } };
      const turbopack = config.turbopack ?? {};
      const rules = turbopack.rules ?? {};
      const jsxFiles = '*.{tsx,jsx}';
      const existing = rules[jsxFiles];
      const jsxRules = existing == null ? [] : Array.isArray(existing) ? existing : [existing];
      return {
        ...config,
        turbopack: {
          ...turbopack,
          rules: { ...rules, [jsxFiles]: [{ loaders: [loader] }, ...jsxRules] },
        },
        webpack(webpackConfig, context) {
          const resolved = typeof config.webpack === 'function' ? config.webpack(webpackConfig, context) : webpackConfig;
          resolved.module.rules.push({ test: /\.[jt]sx$/, enforce: 'pre', use: [loader] });
          return resolved;
        },
      };
    },
  };
}
