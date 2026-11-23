const path = require('node:path');

const upstream = require(process.env.BUILDUI_EXPO_BABEL_TRANSFORMER);
const nativeModules = new Set(['react-native', 'react-native-reanimated', 'react-native-safe-area-context']);

function sourceTags({ types: t }, { file }) {
  const tagName = (node) => t.isJSXMemberExpression(node)
    ? `${tagName(node.object)}.${node.property.name}` : node.name;

  return {
    visitor: {
      Program(program) {
        // Expo 的 Web 优化会重写 React Native 导入，先用原始 JSX 和导入识别组件。
        program.traverse({ JSXOpeningElement: markElement });
      },
    },
  };

  function markElement(element) {
    const { name, attributes, loc } = element.node;
    if (!loc || (!t.isJSXIdentifier(name) && !t.isJSXMemberExpression(name))) return;
    const tag = tagName(name);
    const isDOM = t.isJSXIdentifier(name) && /^[a-z]/.test(tag);
    const binding = element.scope.getBinding(tag.split('.')[0]);
    const isNative = binding?.path.parentPath?.isImportDeclaration()
      && nativeModules.has(binding.path.parent.source.value);
    if (!isDOM && !isNative) return;

    const source = `${file}:${loc.start.line}:${loc.start.column + 1}`;
    if (isDOM) {
      attributes.push(t.jsxAttribute(t.jsxIdentifier('data-buildui-source'), t.stringLiteral(source)));
      return;
    }

    // React Native Web 将 dataSet 转成 DOM 的 data-* 属性。
    const dataset = attributes.findLast((attr) => t.isJSXAttribute(attr) && attr.name.name === 'dataSet');
    const properties = [
      t.objectProperty(t.identifier('builduiSource'), t.stringLiteral(source)),
      t.objectProperty(t.identifier('builduiTag'), t.stringLiteral(tag)),
    ];
    if (dataset) {
      if (t.isJSXExpressionContainer(dataset.value)) {
        properties.unshift(t.spreadElement(dataset.value.expression));
      }
      dataset.value = t.jsxExpressionContainer(t.objectExpression(properties));
    } else {
      // 保留调用者通过展开属性传入的 dataSet 的优先级。
      attributes.unshift(t.jsxAttribute(t.jsxIdentifier('dataSet'), t.jsxExpressionContainer(t.objectExpression(properties))));
    }
  }
}

module.exports = {
  getCacheKey: upstream.getCacheKey,
  transform(args) {
    const { filename, options, plugins = [] } = args;
    const file = path.relative(options.projectRoot, path.resolve(options.projectRoot, filename)).split(path.sep).join('/');
    const parts = file.split('/');
    if (options.platform !== 'web' || !options.dev || options.type === 'script'
      || options.customTransformOptions?.environment === 'node'
      || options.customTransformOptions?.environment === 'react-server'
      || path.isAbsolute(file) || parts.some((part) => part.startsWith('.') || part === 'node_modules')
      || !/\.[jt]sx?$/.test(file)) {
      return upstream.transform(args);
    }
    return upstream.transform({ ...args, plugins: [[sourceTags, { file }], ...plugins] });
  },
};
