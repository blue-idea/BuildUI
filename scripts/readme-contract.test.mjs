import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readmeFiles = [
  'README.md',
  'README.zh-CN.md',
  'README.es.md',
  'README.pt-BR.md',
  'README.fr.md',
  'README.ja.md',
];
const screenshotReferences = [
  'assets/readme/buildui-home.png',
  'assets/readme/buildui-components.png',
];

async function readProjectFile(relativePath) {
  return readFile(resolve(projectRoot, relativePath), 'utf8');
}

test('README 多语言版本应完整覆盖安装、定位、功能与语言切换契约', async () => {
  for (const reference of screenshotReferences) {
    await assert.doesNotReject(
      () => access(resolve(projectRoot, reference)),
      `${reference} is missing`
    );
  }

  for (const file of readmeFiles) {
    await assert.doesNotReject(
      () => access(resolve(projectRoot, file)),
      `${file} is missing`
    );

    const content = await readProjectFile(file);
    const topMatter = content.slice(0, 1800);

    assert.match(content, /^# BuildUI/m, `${file} must have a BuildUI title`);
    assert.ok(
      readmeFiles.every((target) => content.includes(`(${target})`)),
      `${file} must link to every README language`
    );
    assert.match(topMatter, /brew install --cask blue-idea\/tap\/buildui/);
    assert.match(topMatter, /brew update/);
    assert.match(topMatter, /brew upgrade --cask buildui/);
    assert.ok(
      screenshotReferences.every((reference) => content.includes(reference)),
      `${file} must include the product screenshots`
    );
    assert.doesNotMatch(content, /dyad/i, `${file} must not mention Dyad`);
    assert.doesNotMatch(content, /blot[- ]ui/i, `${file} must use the BuildUI name`);
    assert.doesNotMatch(content, /\r\n/, `${file} must use LF line endings`);
  }
});

test('英文 README 应明确产品定位与非替代关系', async () => {
  const content = await readProjectFile('README.md');

  assert.match(content, /Code builds everything/i);
  assert.match(content, /prototype/i);
  assert.match(content, /Claude Code/i);
  assert.match(content, /Cursor/i);
  assert.match(content, /not a replacement/i);
  assert.ok(
    content.indexOf('## Install') < content.indexOf('## Why BuildUI'),
    'Installation must appear before the product overview'
  );
});
