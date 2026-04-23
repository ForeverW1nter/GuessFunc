import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export default {
  contextSeparator: '_',
  createOldCatalogs: false,
  defaultNamespace: 'translation',
  defaultValue: '',
  indentation: 2,
  keepRemoved: false,
  keySeparator: '.',
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
    js: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    default: ['JavascriptLexer']
  },
  locales: ['en', 'zh'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx,js,jsx}'],
  sort: true,
  useKeysAsDefaultValue: false,
  verbose: true,
  failOnWarnings: false,
  customValueTemplate: null
};