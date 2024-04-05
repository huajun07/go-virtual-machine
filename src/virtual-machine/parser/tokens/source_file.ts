import { Compiler } from '../../compiler'
import {
  BlockInstruction,
  CallInstruction,
  LoadVariableInstruction,
} from '../../compiler/instructions'
import { NoType, Type } from '../../compiler/typing'

import { Token } from './base'
import { TopLevelDeclarationToken } from './declaration'

export class SourceFileToken extends Token {
  constructor(
    public pkg: string,
    public imports: ImportToken[] | null,
    public declarations: TopLevelDeclarationToken[] | null,
  ) {
    super('source_file')
  }

  override compile(compiler: Compiler): Type {
    const global_block = new BlockInstruction()
    compiler.instructions.push(global_block)
    compiler.context.push_env()
    compiler.type_environment = compiler.type_environment.extend()
    for (const declaration of this.declarations || []) {
      declaration.compile(compiler)
    }
    const [frame_idx, var_idx] = compiler.context.env.find_var('main')
    compiler.instructions.push(new LoadVariableInstruction(frame_idx, var_idx))
    compiler.instructions.push(new CallInstruction(0))
    const vars = compiler.context.env.get_frame()
    global_block.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    return new NoType()
  }
}

export class ImportToken extends Token {
  constructor(public importPath: string, public pkgName: string | null) {
    super('import')
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}
