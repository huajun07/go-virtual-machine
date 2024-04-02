import { Compiler } from '../../compiler'
import {
  BoolType,
  ChannelType,
  Float64Type,
  FunctionType,
  Int64Type,
  NoType,
  ParameterType,
  StringType,
  Type,
  Uint64Type,
} from '../../compiler/typing'

import { Token } from './base'
import { IntegerLiteralToken } from './literals'

export abstract class TypeToken extends Token {
  constructor() {
    super('type')
  }
}

/**
 * Note that PrimitiveTypeToken is not a native Golang construct.
 * It is used to encompass Boolean, Numeric, and String types.
 */
export class PrimitiveTypeToken extends TypeToken {
  static primitiveTypes = [
    'bool',
    'uint64',
    'int64',
    'float64',
    'int',
    'string',
  ] as const

  static isPrimitive = (
    name: unknown,
  ): name is (typeof PrimitiveTypeToken.primitiveTypes)[number] => {
    return PrimitiveTypeToken.primitiveTypes.includes(
      // This type cast is necessary as .includes only accepts types equal to an array element.
      name as (typeof PrimitiveTypeToken.primitiveTypes)[number],
    )
  }

  static isPrimitiveToken = (token: unknown): token is PrimitiveTypeToken => {
    return (
      token instanceof PrimitiveTypeToken &&
      PrimitiveTypeToken.isPrimitive(token.name)
    )
  }

  name: (typeof PrimitiveTypeToken.primitiveTypes)[number]

  constructor(name: string) {
    super()
    if (!PrimitiveTypeToken.isPrimitive(name)) {
      throw Error(`Invalid primitive type: ${name}`)
    }
    this.name = name
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    if (this.name === 'bool') return new BoolType()
    else if (this.name === 'float64') return new Float64Type()
    else if (this.name === 'int') return new Int64Type()
    else if (this.name === 'int64') return new Int64Type()
    else if (this.name === 'uint64') return new Uint64Type()
    else if (this.name === 'string') return new StringType()
    else return new NoType()
  }
}

export class ArrayTypeToken extends TypeToken {
  constructor(public element: TypeToken, public length: IntegerLiteralToken) {
    super()
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class SliceTypeToken extends TypeToken {
  constructor(public element: TypeToken) {
    super()
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

type ParameterDecl = {
  identifier: string | null
  type: TypeToken
}
export class FunctionTypeToken extends TypeToken {
  public parameters: ParameterDecl[]
  public results: ParameterDecl[]

  constructor(parameters: ParameterDecl[], results: ParameterDecl[] | null) {
    super()
    this.parameters = parameters
    this.results = results ?? []
  }

  override compile(compiler: Compiler): Type {
    const parameterTypes = this.parameters.map(
      (p) => new ParameterType(p.identifier, p.type.compile(compiler)),
    )
    const resultTypes = this.results.map(
      (r) => new ParameterType(r.identifier, r.type.compile(compiler)),
    )
    return new FunctionType(parameterTypes, resultTypes)
  }
}

export class MapTypeToken extends TypeToken {
  constructor(public key: TypeToken, public element: TypeToken) {
    super()
  }

  override compile(_compiler: Compiler): Type {
    //! TODO: Implement.
    return new NoType()
  }
}

export class ChannelTypeToken extends TypeToken {
  constructor(
    public element: TypeToken,
    public readable: boolean,
    public writable: boolean,
  ) {
    super()
  }

  override compile(compiler: Compiler): Type {
    return new ChannelType(
      this.element.compile(compiler),
      this.readable,
      this.writable,
    )
  }
}
