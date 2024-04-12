import { Compiler } from '../../compiler'
import {
  BlockInstruction,
  CallInstruction,
  LoadConstantInstruction,
  LoadVariableInstruction,
  StoreInstruction,
} from '../../compiler/instructions'
import { BoolType, NoType, Type } from '../../compiler/typing'
import { builtinPackages } from '../../compiler/typing/packages'

import { Token } from './base'
import { TopLevelDeclarationToken } from './declaration'
import { StringLiteralToken } from './literals'

export class SourceFileToken extends Token {
  constructor(
    public pkg: string,
    public imports: ImportToken[] | null,
    public declarations: TopLevelDeclarationToken[] | null,
  ) {
    super('source_file')
  }

  override compile(compiler: Compiler): Type {
    // Setup.
    const global_block = new BlockInstruction('GLOBAL')
    compiler.instructions.push(global_block)
    compiler.context.push_env()
    compiler.type_environment = compiler.type_environment.extend()

    // Compile imports.
    for (const imp of this.imports ?? []) imp.compile(compiler)

    // Declare builtin constants for `true` and `false`.
    this.predeclareConstants(compiler)

    // Compile top level declarations.
    for (const declaration of this.declarations || []) {
      declaration.compile(compiler)
    }

    // Call main function.
    const [frame_idx, var_idx] = compiler.context.env.find_var('main')
    compiler.instructions.push(
      new LoadVariableInstruction(frame_idx, var_idx, 'main'),
    )
    compiler.instructions.push(new CallInstruction(0))
    const vars = compiler.context.env.get_frame()
    global_block.set_frame(
      vars.map((name) => compiler.type_environment.get(name)),
    )
    global_block.set_identifiers(vars)
    return new NoType()
  }

  private predeclareConstants(compiler: Compiler): void {
    const constants = [
      {
        name: 'true',
        loadInstruction: new LoadConstantInstruction(true, new BoolType()),
        type: new BoolType(),
      },
      {
        name: 'false',
        loadInstruction: new LoadConstantInstruction(false, new BoolType()),
        type: new BoolType(),
      },
    ]
    for (const constant of constants) {
      const { name, loadInstruction, type } = constant
      const [frame_idx, var_idx] = compiler.context.env.declare_var(name)
      compiler.instructions.push(
        loadInstruction,
        new LoadVariableInstruction(frame_idx, var_idx, name),
        new StoreInstruction(),
      )
      compiler.type_environment.addType(name, type)
    }
  }
}

export class ImportToken extends Token {
  constructor(
    public importPath: StringLiteralToken,
    public pkgName: string | null,
  ) {
    super('import')
  }

  override compile(compiler: Compiler): Type {
    const pkg = this.importPath.getValue()
    if (pkg in builtinPackages) {
      compiler.type_environment.addType(
        pkg,
        builtinPackages[pkg as keyof typeof builtinPackages],
      )
    }
    return new NoType()
  }
}
