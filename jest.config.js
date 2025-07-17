/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  testPathIgnorePatterns: ["build"],
  transform: {
    "\\.[jt]sx?$": ['ts-jest', { "useESM": true }],
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
};
