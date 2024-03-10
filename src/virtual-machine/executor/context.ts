class Context {
  PC = 0
  OS: number[] = []

  pushOS(x: number) {
    this.OS.push(x)
  }

  popOS() {
    return this.OS.pop()
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
