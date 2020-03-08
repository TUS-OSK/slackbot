module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:prettier/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "no-var": "warn",
        "no-unused-vars": "warn"
    },
    "overrides": [
        {
            "files": ['**/*.ts'],
            "extends": [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "prettier/@typescript-eslint"
            ],
            "parser": "@typescript-eslint/parser",
            "plugins": [
                "@typescript-eslint"
            ],
            "rules": {}
        }
    ]
};