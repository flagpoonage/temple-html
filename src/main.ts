import { readFile, exists } from 'fs';
import { Token, ValueToken } from './types';
import { CHAR } from './characters';
import { tokenize } from './lexer';
import { parseChildren } from './parser';

const filename = process.argv[2];

async function readFileData (filename: string) {
  try {
    const has_file = await new Promise(
      (rs) => exists(filename, rs));

    if (!has_file) {
      return null;
    }

    return await new Promise<string>(
      (rs, rj) => readFile(filename, { encoding: 'utf8' }, (e, d) => e ? rj(e) : rs(d)));
  }
  catch (exception) {
    console.error(exception);
    return null;
  }
}

(async () => {

  const result = await readFileData(filename);

  if (!result) {
    console.info('No data to parse');
    return;
  }

  try {
    const tokens = tokenize(result);
    const ast = parseChildren(tokens);

    console.log(ast);
  }
  catch (ex) {
    console.error(ex);
  }


})();