export default {
  '**/*.go': [
    'gofmt -w',
    () => 'go vet ./...',
  ],
  'frontend/src/**/*.{ts,tsx}': [
    () => 'npm --prefix frontend run lint',
    () => 'npm --prefix frontend run build',
  ],
};
