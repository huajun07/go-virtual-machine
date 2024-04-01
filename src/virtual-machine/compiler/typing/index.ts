import {
  ArrayTypeToken,
  PrimitiveTypeToken,
  SliceTypeToken,
  TypeToken,
} from '../../parser/tokens'

export abstract class Type {
  abstract isPrimitive(): boolean
  abstract toString(): string

  equals(t: unknown): boolean {
    // Note: If this is too slow, we can speed it up by recursively comparing
    // without converting them to strings first.
    return t instanceof Type && this.toString() === t.toString()
  }

  /** Parse a type token into its corresponding type. */
  static fromToken(token: TypeToken): Type {
    if (PrimitiveTypeToken.isPrimitiveToken(token)) {
      switch (token.name) {
        case 'bool':
          return new BoolType()
        case 'uint64':
          return new Uint64Type()
        case 'int64':
          return new Int64Type()
        case 'float64':
          return new Float64Type()
        case 'int':
          return new Int64Type()
        case 'string':
          return new StringType()
      }
    } else if (token instanceof ArrayTypeToken) {
      return new ArrayType(
        Type.fromToken(token.element),
        token.length.getValue(),
      )
    } else if (token instanceof SliceTypeToken) {
      return new SliceType(Type.fromToken(token.element))
    }
    throw Error('Unimplemented.')
  }
}

/** This type represents things that don't have an associated type, like statements. */
export class NoType extends Type {
  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return ''
  }
}

export class BoolType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'bool'
  }
}

export class Uint64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'uint64'
  }
}

export class Int64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'int64'
  }
}

export class Float64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'float64'
  }
}

export class StringType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'string'
  }
}

export class ArrayType extends Type {
  element: Type
  length: number

  constructor(element: Type, length: number) {
    super()
    this.element = element
    this.length = length
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[${this.length}]${this.element.toString()}`
  }
}

export class SliceType extends Type {
  element: Type

  constructor(element: Type) {
    super()
    this.element = element
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[]${this.element.toString()}`
  }
}
