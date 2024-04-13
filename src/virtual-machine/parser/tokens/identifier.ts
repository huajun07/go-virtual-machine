import { Compiler } from '../../compiler'
import { LoadVariableInstruction } from '../../compiler/instructions'
import { PackageType, Type } from '../../compiler/typing'

import { Token } from './base'

export class IdentifierToken extends Token {
  constructor(public identifier: string) {
    super('identifier')
  }

  static isValidIdentifier(identifier: string): boolean {
    const reservedKeywords = [
      'break',
      'case',
      'chan',
      'const',
      'continue',
      'default',
      'defer',
      'else',
      'fallthrough',
      'for',
      'func',
      'go',
      'goto',
      'if',
      'import',
      'interface',
      'map',
      'package',
      'range',
      'return',
      'select',
      'struct',
      'switch',
      'type',
      'var',
    ]
    return !reservedKeywords.includes(identifier)
  }

  override compile(compiler: Compiler): Type {
    const [frame_idx, var_idx] = compiler.context.env.find_var(this.identifier)
    compiler.instructions.push(
      new LoadVariableInstruction(frame_idx, var_idx, this.identifier),
    )
    return compiler.type_environment.get(this.identifier)
  }
}

export class QualifiedIdentifierToken extends Token {
  constructor(public pkg: string, public identifier: string) {
    super('qualified_identifier')
  }

  override compile(compiler: Compiler): Type {
    const pkg = compiler.type_environment.get(this.pkg)
    if (!(pkg instanceof PackageType)) {
      throw new Error(`${this} is not a type`)
    }
    return pkg.get(this.identifier)
  }

  override toString(): string {
    return `${this.pkg}.${this.identifier}`
  }
}
