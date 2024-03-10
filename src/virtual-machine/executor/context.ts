class Context {
  PC = 0
  OS: number[] = []

  pushOS(x: number) {
    this.OS.push(x)
  }

  popOS() {
    const last = this.OS.pop()
    if(last === undefined) throw Error("OS Empty!")
    return last
  }

  printOS() {
    for (const item of this.OS) {
      console.log(item)
    }
  }

  getRoots() {
    return [...this.OS]
  }
}

export { Context }
