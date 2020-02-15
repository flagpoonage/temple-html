export interface TokenLocation {
  line: number;
  column: number;
}

export interface OpenTagToken {
  type: 'OpenTag';
  location: TokenLocation;
}

export interface CloseTagToken {
  type: 'CloseTag'
  location: TokenLocation;
}

export interface ValueToken {
  type: 'Value',
  content: string;
  start: TokenLocation;
  end: TokenLocation | null;
};

export interface PropertyJoinToken {
  type: 'PropertyJoin',
  content: string;
  location: TokenLocation;
}

export interface ParsedTag {
  tagName: string;
  tagProps: TagProperty[];
  tagChildren: ParsedTag[];
}

export type TagProperty = [string, string | null];

export type NonValueToken = OpenTagToken | CloseTagToken | PropertyJoinToken;

export type PropertyToken = ValueToken | PropertyJoinToken;

export type Token = OpenTagToken | CloseTagToken | ValueToken | PropertyJoinToken;