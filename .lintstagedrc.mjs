export default {
  '**/*.go': [
    'gofmt -w',
    'go vet ./...',
  ],
  'frontend/src/**/*.{ts,tsx}': (filenames) => [
    `pnpm --prefix frontend exec eslint --fix ${filenames.map((f) => `"${f}"`).join(' ')}`,
    'pnpm --prefix frontend exec tsc -p tsconfig.json --noEmit',
  ],
};
