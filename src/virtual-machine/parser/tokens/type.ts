import { Token } from './base'
import { IntegerLiteralToken } from './literals'

export class TypeToken extends Token {
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
}

export class ArrayTypeToken extends TypeToken {
  element: TypeToken
  length: IntegerLiteralToken

  constructor(element: TypeToken, length: IntegerLiteralToken) {
    super()
    this.element = element
    this.length = length
  }
}

export class SliceTypeToken extends TypeToken {
  element: TypeToken

  constructor(element: TypeToken) {
    super()
    this.element = element
  }
}

type ParameterDecl = {
  identifier?: string
  type: TypeToken
}
export class FunctionTypeToken extends TypeToken {
  parameters: ParameterDecl[]
  result?: ParameterDecl[]

  constructor(
    parameters: ParameterDecl[] | undefined,
    result?: ParameterDecl[],
  ) {
    super()
    this.parameters = parameters ?? []
    this.result = result
  }
}

export class MapTypeToken extends TypeToken {
  constructor(public key: TypeToken, public element: TypeToken) {
    super()
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
}
