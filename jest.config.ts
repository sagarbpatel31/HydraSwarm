import type { Config } from "jest";

const config: Config = {
  projects: [
    // Backend tests (node environment)
    {
      displayName: "backend",
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testMatch: ["**/src/__tests__/lib/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "tsconfig.json" },
        ],
      },
    },
    // Frontend tests (jsdom environment)
    {
      displayName: "frontend",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/src"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "\\.(css)$": "<rootDir>/src/__tests__/__mocks__/styleMock.ts",
      },
      testMatch: ["**/src/__tests__/components/**/*.test.tsx", "**/src/__tests__/frontend/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "tsconfig.json" },
        ],
      },
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
      transformIgnorePatterns: ["/node_modules/(?!reactflow|@reactflow)"],
    },
  ],
};

export default config;
