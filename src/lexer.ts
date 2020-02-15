import { Token, ValueToken } from "./types";
import { CHAR } from "./characters";


type TokenizerContext = 
'token-start' | 
'value-content' |
'value-string-content' |
'value-string-escape-content';

interface TokenResult {
  token: Token;
  complete: boolean;
}

export function tokenize (input: string, options?: any): Token[] {
  // Convert out windows line break style.
  input = input.replace('\r\n', '\n').replace('\r', '\n');
  
  const input_length = input.length;
  const tokens: Token[] = [];
  
  let line_index = 0;
  let column_index = 0;
  let input_index = 0;
  
  let file_start = input.indexOf('{');
  
  if (file_start === -1) {
    throw new Error('No start of file opening tag found \'{\'');
  }
  
  let preamble = input.slice(0, file_start);
  let preamble_lines = preamble.split('').filter(a => a.charCodeAt(0) === CHAR.NEWLINE).length;
  let final_index = preamble.lastIndexOf(String.fromCharCode(CHAR.NEWLINE));
  
  final_index = final_index === -1 ? 0 : final_index;
  let line_start = final_index + 1;
  column_index = file_start - line_start;
  line_index = preamble_lines - 1;
  
  tokens.push({ 
    type: 'OpenTag',
    location: {
      column: column_index,
      line: line_index
    }
  });
  
  let tokenizer_context: TokenizerContext = 'token-start';
  
  input_index = file_start + 1;
  column_index += 1;
  
  let value_token: ValueToken = {
    type: 'Value',
    content: '',
    start: { line: 0, column: 0 },
    end: null
  }; // TS lint only predefined
  
  while (input_index < input_length) {
    const char_code = input.charCodeAt(input_index);
    const char_index = input_index;
    const char_column_index = column_index;
    
    input_index++;
    column_index++;
    
    switch (tokenizer_context) {
      case 'token-start': {
        switch (char_code) {
          case CHAR.NEWLINE: {
            column_index = 0;
            line_index++;
            break;
          }
          case CHAR.TAB:
          case CHAR.SPACE: {
            break;
          }
          case CHAR.ESCAPE: {
            throw new Error(`Unexpected escape sequence outside of string token at ${line_index}:${char_column_index}`);
          }
          default: {
            const result = tokenizeStart(char_code, char_column_index, line_index);
            
            if (result.complete) {
              tokens.push(result.token);
            }
            else {
              value_token = result.token as ValueToken;
              tokenizer_context = value_token.content.length === 0 
              ? 'value-string-content'
              : 'value-content';
            }
          }
        }
        break;
      }
      case 'value-content': {
        switch (char_code) {
          case CHAR.NEWLINE: {
            value_token.end = {
              line: line_index,
              column: char_column_index - 1
            };
            
            tokens.push(value_token);
            tokenizer_context = 'token-start';
            
            column_index = 0;
            line_index++;
            break;
          }
          case CHAR.SPACE:
          case CHAR.TAB: {
            value_token.end = {
              line: line_index,
              column: char_column_index - 1
            };
            
            tokens.push(value_token);
            tokenizer_context = 'token-start';
            break;
          }
          case CHAR.EQ:
          case CHAR.OPEN_TAG:
          case CHAR.CLOSE_TAG: {
            value_token.end = {
              line: line_index,
              column: char_column_index - 1
            };
            
            tokens.push(value_token);
            tokens.push(tokenizeStart(char_code, char_column_index, line_index).token);
            tokenizer_context = 'token-start';
            break;
          }
          case CHAR.ESCAPE: {
            throw new Error(`Unexpected escape sequence outside of string token at ${line_index}:${char_column_index}`);
          } 
          case CHAR.QUOTE: {
            throw new Error(`Unexpected value while reading string at ${line_index}:${char_column_index}`);
          }
          default:
          value_token.content += String.fromCharCode(char_code);
          break;
        }
        break;
      }
      case 'value-string-content': {
        switch (char_code) {
          case CHAR.QUOTE: {
            value_token.end = {
              line: line_index,
              column: char_column_index - 1
            };
            
            tokens.push(value_token);
            tokenizer_context = 'token-start';
            break;
          }
          case CHAR.ESCAPE: {
            tokenizer_context = 'value-string-escape-content';
            break;
          }
          default: {
            value_token.content += String.fromCharCode(char_code);
            break;
          }
        }
        break;
      }
      case 'value-string-escape-content': {
        value_token.content += String.fromCharCode(char_code);
        // TS compiler error without this
        tokenizer_context = 'value-string-content' as TokenizerContext; 
        break;
      } 
    }
  }
  
  return tokens;
};

function tokenizeStart (char: number, column: number, line: number): TokenResult {
  const location = { line, column };
  switch (char) {
    case CHAR.EQ:
    return {
      token: {
        type: 'PropertyJoin',
        content: '=',
        location
      },
      complete: true
    };
    case CHAR.CLOSE_TAG: 
    return {
      token: {
        type: 'CloseTag',
        location
      },
      complete: true
    };
    case CHAR.OPEN_TAG:
    return {
      token: {
        type: 'OpenTag',
        location
      },
      complete: true
    };
    case CHAR.QUOTE:
    return {
      token: {
        type: 'Value',
        content: '',
        start: location,
        end: null
      },
      complete: false
    };
    default: 
    return {
      token: {
        type: 'Value',
        content: String.fromCharCode(char),
        start: location,
        end: null
      },
      complete: false
    };
  }
}