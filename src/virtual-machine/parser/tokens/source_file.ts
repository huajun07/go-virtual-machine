import { Compiler } from '../../compiler'
import { NoType, Type } from '../../compiler/typing'

import { Token } from './base'
import {
  FunctionDeclarationToken,
  TopLevelDeclarationToken,
} from './declaration'

export class SourceFileToken extends Token {
  constructor(
    public pkg: string,
    public imports: ImportToken[] | null,
    public declarations: TopLevelDeclarationToken[] | null,
  ) {
    super('source_file')
  }

  override compile(compiler: Compiler): Type {
    //! TODO: Implement Calling of main function from function declaration
    // Pending Function Signature Tokenisation
    for (const declaration of this.declarations || []) {
      if (declaration instanceof FunctionDeclarationToken) {
        if (declaration.name.identifier === 'main' && !declaration.func.body) {
          throw Error('Main Body Empty')
        }
        declaration.compile(compiler)
      }
    }

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
