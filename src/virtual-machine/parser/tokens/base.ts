import { Compiler } from '../../compiler'
import { Type } from '../../compiler/typing'

export type TokenLocation = {
  start: { offset: number; line: number; column: number }
  end: { offset: number; line: number; column: number }
}

export abstract class Token {
  constructor(public type: string, public sourceLocation: TokenLocation) {}

  abstract compileUnchecked(compiler: Compiler): Type
}
