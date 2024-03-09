import { Token } from './base'

export abstract class LiteralToken extends Token {
  value: number | string

  constructor(value: number | string) {
    super('literal')
    this.value = value
  }

  static is(token: Token): token is LiteralToken {
    return token.type === 'literal'
  }
}

export class IntegerLiteralToken extends LiteralToken {
  /** Tokenize an integer literal in the given base. */
  static fromSource(str: string, base: number) {
    // Golang numbers can be underscore delimited.
    const value = parseInt(str.replace('_', ''), base)
    return new IntegerLiteralToken(value)
  }
}

export class FloatLiteralToken extends LiteralToken {
  /** Tokenize a float literal. */
  static fromSource(str: string) {
    const value = parseFloat(str)
    return new FloatLiteralToken(value)
  }
}

export class StringLiteralToken extends LiteralToken {
  /** Tokenize a raw string literal. */
  static fromSourceRaw(str: string) {
    // Carriage returns are discarded from raw strings.
    str = str.replaceAll('\r', '')
    return new StringLiteralToken(str)
  }

  /** Tokenize an interpreted string literal. */
  static fromSourceInterpreted(str: string) {
    return new StringLiteralToken(str)
  }
}
