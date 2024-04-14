import { Heap } from '../../heap'
import { WaitGroupNode } from '../../heap/types/waitGroup'

import {
  FunctionType,
  Int64Type,
  PackageType,
  ParameterType,
  ReturnType,
  Type,
} from '.'

export class WaitGroupType extends Type {
  override isPrimitive(): boolean {
    return false
  }

  override toString(): string {
    return `sync.WaitGroup`
  }

  override equals(t: Type): boolean {
    return t instanceof WaitGroupType
  }

  override defaultNodeCreator(): (heap: Heap) => number {
    return (heap) => WaitGroupNode.default(heap).addr
  }

  override select(identifier: string): Type {
    if (identifier === 'Add') {
      return new FunctionType(
        [new ParameterType(null, new Int64Type())],
        new ReturnType([]),
      )
    } else if (identifier === 'Done') {
      return new FunctionType([], new ReturnType([]))
    } else if (identifier === 'Wait') {
      return new FunctionType([], new ReturnType([]))
    }
    throw new Error(
      `.${identifier} undefined (type ${this} has no field or method ${identifier})`,
    )
  }
}

export const builtinPackages = {
  sync: new PackageType('sync', {
    WaitGroup: new WaitGroupType(),
  }),
}
