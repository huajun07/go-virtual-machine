import { Token } from './base'

export class IdentifierToken extends Token {
  identifier: string

  constructor(idenifier: string) {
    super('identifier')
    this.identifier = idenifier
  }
}

//! TODO (P2): QualifiedIdentifier is not supported for now,
//! because idk how to resolve its parsing ambiguity with selector.
