module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|rehype-raw|remark-gfm|rehype-highlight|hast-util-to-string|hast-util-raw|hast-util-from-parse5|hast-util-parse-selector|hastscript|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces)/)',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['']
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx']
};
