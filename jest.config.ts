import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'es2022',
          target: 'es2022',
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@nestjs)/)'],
  testEnvironment: 'node',
};

export default config;
