import { Token, PropertyToken, TagProperty, ParsedTag } from "./types";


export function parseChildren (tokens: Token[]): ParsedTag[] {
  if (tokens.length === 0) {
    return [];
  }

  const children: ParsedTag[] = [];
  let remaining_tokens = tokens;

  while (remaining_tokens.length > 0) {
    const first_token = remaining_tokens[0];

    console.log('Checking tag', first_token, children);

    if (first_token.type === 'CloseTag') {
      break;
    }

    if (first_token.type !== 'OpenTag') {
      throw new Error(`Expected an open tag, but received ${first_token.type} at ${locString(first_token)}`)
    }

    const result = parseTag(remaining_tokens.slice(1));

    console.log('Result tag', result.tag);

    children.push(result.tag);
    remaining_tokens = result.remaining;
  }

  console.log('Returning parsed children');

  return children;
}



function locString (token: Token): string {
  if (token.type === 'Value') {
    return `${token.start.line}:${token.start.column}`;
  }
  else {
    return `${token.location.line}:${token.location.column}`;
  }
}

type ParsedTagResult = {
  tag: ParsedTag;
  remaining: Token[];
};

function parseTag (tokens: Token[]): ParsedTagResult {
  const token = tokens[0];
  const type = token.type;

  if (token.type !== 'Value') {
    throw new Error(`Expected tag name, but received ${type} at ${locString(token)}`);
  }
  
  const tagName = token.content;

  const nextTokens = tokens.slice(1);
  const nextTagTokenIndex = nextTokens.findIndex(a => a.type === 'CloseTag' || a.type === 'OpenTag');

  if (nextTagTokenIndex === -1) {
    throw new Error(`Unable to find a closing tag for ${tagName} at ${locString(token)}`);
  }

  const propsTokens = nextTokens.slice(0, nextTagTokenIndex) as PropertyToken[];

  console.log(`'${tagName}' property tokens`, propsTokens);
  
  const tagProps = nextTagTokenIndex === 0 ? [] : parseProps(propsTokens);

  console.log('Received tag props', tagProps);

  const nextChildToken = nextTokens[nextTagTokenIndex];
  const tagChildren = nextChildToken.type === 'CloseTag' ? [] : parseChildren(nextTokens.slice(nextTagTokenIndex))



  return {
    tag: {
      tagName,
      tagProps,
      tagChildren
    },
    remaining: nextTokens.slice(nextTagTokenIndex + 1)
  };
}

function parseProps (tokens: PropertyToken[]): TagProperty[] {
  const props: TagProperty[] = [];

  let current = null;
  let is_joint = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'Value' && current) {
      if (is_joint) {
        props.push([current, token.content]);
        current = null;
        is_joint = false;
      }
      else {
        props.push([current, null]);
        current = token.content;
      }
    }
    else if (token.type === 'Value') {
      current = token.content;
      is_joint = false;
    }
    else if (token.type === 'PropertyJoin' && !current) {
      throw new Error(`Trying to assign a property that has no name at ${locString(tokens[i])}`);
    }
    else if (token.type === 'PropertyJoin') {
      is_joint = true;
    }
  }

  if (current) {
    props.push([current, null]);
  }

  return props;
}