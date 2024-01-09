import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@root/(.*)$": "<rootDir>/src/$1",
    },
};

export default jestConfig