import { Token } from './base'
import { TopLevelDeclarationToken } from './declaration'

export class SourceFileToken extends Token {
  pkg: string
  imports: ImportToken[]
  declarations: TopLevelDeclarationToken[]

  constructor(
    pkg: string,
    imports?: ImportToken[],
    declarations?: TopLevelDeclarationToken[],
  ) {
    super('source_file')
    this.pkg = pkg
    this.imports = imports ?? []
    this.declarations = declarations ?? []
  }
}

export class ImportToken extends Token {
  importPath: string
  pkgName?: string

  constructor(importPath: string, pkgName?: string) {
    super('import')
    this.importPath = importPath
    this.pkgName = pkgName
  }
}
