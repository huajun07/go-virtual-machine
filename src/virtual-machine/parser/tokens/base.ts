import { Compiler } from 'src/virtual-machine/compiler'
import { Type } from 'src/virtual-machine/compiler/typing'

export abstract class Token {
  type: string

  constructor(type: string) {
    this.type = type
  }

  abstract compile(compiler: Compiler): Type
}
