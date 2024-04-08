import { Heap } from '../../heap'
import { WaitGroupNode } from '../../heap/types/waitGroup'

import { PackageType, Type } from '.'

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
}

export const builtinPackages = {
  sync: new PackageType('sync', {
    WaitGroup: new WaitGroupType(),
  }),
}
