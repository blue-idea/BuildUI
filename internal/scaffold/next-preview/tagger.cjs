const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceAttribute = 'data-buildui-source';
const inspector = fs.readFileSync(path.join(__dirname, 'preview-inspector.js'), 'utf8');
const script = '<script id="__buildui_preview_inspector__" dangerouslySetInnerHTML={{__html:' + JSON.stringify(inspector) + '}} />';
const rootLayout = /^(?:src\/)?app\/(?:[^/]+\/)*layout\.[jt]sx$/;

module.exports = function tagPreviewSource(source) {
  const { projectRoot } = this.getOptions();
  const file = path.relative(projectRoot, this.resourcePath).split(path.sep).join('/');
  if (path.isAbsolute(file) || file.split('/').some(part => part.startsWith('.') || part === 'node_modules')) return source;

  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, false);
  const insertions = [];
  const insert = (offset, text) => insertions.push({ offset, text });
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const tag = node.tagName.text;
      if (/^[a-z]/.test(tag) && !node.attributes.properties.some(
        attr => ts.isJsxAttribute(attr) && attr.name.getText(parsed) === sourceAttribute,
      )) {
        const { line, character } = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
        const position = `${file}:${line + 1}:${character + 1}`;
        const end = node.end - (ts.isJsxSelfClosingElement(node) ? 2 : 1);
        insert(end, ` ${sourceAttribute}={${JSON.stringify(position)}}`);
      }
    }
    if (ts.isJsxElement(node) && rootLayout.test(file) && node.openingElement.tagName.getText(parsed) === 'body') {
      insert(node.closingElement.getStart(parsed), script);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);

  // 倒序插入，保证标记中的源码行列始终对应原文件。
  for (const { offset, text } of insertions.sort((a, b) => b.offset - a.offset)) {
    source = source.slice(0, offset) + text + source.slice(offset);
  }
  return source;
};
