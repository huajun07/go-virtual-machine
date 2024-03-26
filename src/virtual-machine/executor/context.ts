import { Heap } from "../heap"

class Context {
  PC = 0
  OS: number[] = []
  E = 0
  RTS: number[] = []
  T: number[] = []

  pushOS(x: number) {
    this.OS.push(x)
  }

  popOS() {
    const last = this.OS.pop()
    if (last === undefined) throw Error('OS Empty!')
    return last
  }

  peekOS() {
    return this.OS.pop()
  }

  printOS(heap: Heap) {
    for (const item of this.OS) {
      console.log('OS:', item, heap.get_value(item))
    }
  }

  pushRTS(x: number) {
    this.RTS.push(x)
  }

  popRTS() {
    const last = this.RTS.pop()
    if (last === undefined) throw Error('RTS Empty!')
    return last
  }

  pushT(x: number) {
    this.T.push(x)
  }

  popT() {
    const last = this.T.pop()
    if (last === undefined) throw Error('T Empty!')
    return last
  }

  printRTS() {
    for (const item of this.RTS) {
      console.log(item)
    }
  }

  getRoots() {
    return [...this.OS, ...this.RTS, this.E, ...this.T]
  }
}

export { Context }
