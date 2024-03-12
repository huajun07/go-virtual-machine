export class CompileEnvironment {
  frames: string[][]
  constructor(parent?: CompileEnvironment) {
    if (!parent) {
      this.frames = [[]]
    } else {
      this.frames = parent.frames
      this.frames.push([])
    }
  }

  find_var(name: string) {
    let frame_idx = this.frames.length - 1
    while (frame_idx >= 0) {
      let var_idx = this.frames[frame_idx].length - 1
      while (var_idx >= 0) {
        if (this.frames[frame_idx][var_idx] === name)
          return [frame_idx, var_idx]
        var_idx--
      }
      frame_idx--
    }
    throw Error('Unable to find variable: ' + name)
  }

  declare_var(name: string) {
    const frame_idx = this.frames.length - 1
    const new_len = this.frames[frame_idx].push(name)
    return [frame_idx, new_len - 1]
  }

  get_frame_size() {
    const frame_idx = this.frames.length - 1
    return this.frames[frame_idx].length
  }
}
