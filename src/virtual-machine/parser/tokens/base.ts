import { Compiler } from '../../compiler'
import { Type } from '../../compiler/typing'

export abstract class Token {
  type: string

  constructor(type: string) {
    this.type = type
  }

  abstract compile(compiler: Compiler): Type
}
