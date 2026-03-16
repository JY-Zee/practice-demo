module.exports = {
  extends: ['@demo/eslint-config/vue'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.vue'],
  },
};
