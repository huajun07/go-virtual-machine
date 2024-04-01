import { Compiler } from 'src/virtual-machine/compiler'
import { LoadVariableInstruction } from 'src/virtual-machine/compiler/instructions'
import { Type } from 'src/virtual-machine/compiler/typing'

import { Token } from './base'

export class IdentifierToken extends Token {
  constructor(public identifier: string) {
    super('identifier')
  }

  override compile(compiler: Compiler): Type {
    const [frame_idx, var_idx] = compiler.context.env.find_var(this.identifier)
    compiler.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
    return compiler.type_environment.get(this.identifier)
  }
}

//! TODO (P2): QualifiedIdentifier is not supported for now,
//! because idk how to resolve its parsing ambiguity with selector.
