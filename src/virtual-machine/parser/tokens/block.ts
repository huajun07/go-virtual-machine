import { Token } from './base'
import { StatementToken } from './statement'

export class BlockToken extends Token {
  statements: StatementToken[]

  constructor(statements: StatementToken[]) {
    super('block')
    this.statements = statements
  }
}
