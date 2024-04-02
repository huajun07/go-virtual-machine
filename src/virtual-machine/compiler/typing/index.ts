export abstract class Type {
  abstract isPrimitive(): boolean
  abstract toString(): string

  abstract equals(t: Type): boolean
}

/** This type represents things that don't have an associated type, like statements. */
export class NoType extends Type {
  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return ''
  }

  override equals(t: Type): boolean {
    return t instanceof NoType
  }
}

export class BoolType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'bool'
  }

  override equals(t: Type): boolean {
    return t instanceof BoolType
  }
}

export class Uint64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'uint64'
  }

  override equals(t: Type): boolean {
    return t instanceof Uint64Type
  }
}

export class Int64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'int64'
  }

  override equals(t: Type): boolean {
    return t instanceof Int64Type
  }
}

export class Float64Type extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'float64'
  }

  override equals(t: Type): boolean {
    return t instanceof Float64Type
  }
}

export class StringType extends Type {
  isPrimitive(): boolean {
    return true
  }

  toString(): string {
    return 'string'
  }

  override equals(t: Type): boolean {
    return t instanceof StringType
  }
}

export class ArrayType extends Type {
  constructor(public element: Type, public length: number) {
    super()
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[${this.length}]${this.element.toString()}`
  }

  override equals(t: Type): boolean {
    return (
      t instanceof ArrayType &&
      this.element.equals(t.element) &&
      this.length === t.length
    )
  }
}

export class SliceType extends Type {
  constructor(public element: Type) {
    super()
  }

  isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return `[]${this.element.toString()}`
  }

  override equals(t: Type): boolean {
    return t instanceof SliceType && this.element.equals(t.element)
  }
}

export class ParameterType extends Type {
  constructor(public identifier: string | null, public type: Type) {
    super()
  }

  override isPrimitive(): boolean {
    return false
  }

  toString(): string {
    return this.identifier === null
      ? `${this.type}`
      : `${this.identifier} ${this.type}`
  }

  override equals(t: Type): boolean {
    return t instanceof ParameterType && this.type.equals(t.type)
  }
}

export class FunctionType extends Type {
  constructor(
    public parameters: ParameterType[],
    public results: ParameterType[],
  ) {
    super()
  }

  override isPrimitive(): boolean {
    return false
  }

  toString(): string {
    const parametersString = TypeUtility.arrayToString(this.parameters)
    const resultsString = TypeUtility.arrayToString(this.results)
    if (this.results.length === 0) {
      return `func(${parametersString})`
    }
    if (this.results.length === 1) {
      return `func(${parametersString}) ${resultsString}`
    }
    return `func(${parametersString}) (${resultsString})`
  }

  override equals(t: Type): boolean {
    return (
      t instanceof FunctionType &&
      this.parameters.length === t.parameters.length &&
      this.results.length === t.results.length &&
      this.parameters.every((p, index) => p.equals(t.parameters[index])) &&
      this.results.every((r, index) => r.equals(t.results[index]))
    )
  }
}

export const TypeUtility = {
  // Similar to Array.toString(), but adds a space after each comma.
  arrayToString(types: Type[] | null) {
    return (types ?? []).map((t) => t.toString()).join(', ')
  },
}
