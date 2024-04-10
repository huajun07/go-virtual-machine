import { Instruction } from '../compiler/instructions'
import { Heap } from '../heap'
import { ContextNode } from '../heap/types/context'
import { EnvironmentNode } from '../heap/types/environment'

export type OSInfo = {
  val: string
  addr: number
}

export type VarInfo = {
  name: string
  val: string
  modified: boolean
}

export type EnvironmentInfo = {
  name: string
  vars: VarInfo[]
  alloc_time: number
  children: EnvironmentInfo[]
  cur: boolean
}

export type InstructionInfo = {
  val: string
  idx: number
  cur: boolean
}

export type ContextInfo = {
  blocked: boolean
  id: number
  addr: number
  OS: OSInfo[]
  instrs: InstructionInfo[]
  envs: EnvironmentInfo
}

export class Debugger {
  thread_cnt = 0
  identifier_map = new Map<number, string[]>()
  env_name_map = new Map<number, string>()
  env_alloc_map = new Map<number, number>()
  context_id_map = new Map<number, number>()
  context_id = 0
  data: ContextInfo[][] = []
  modified_buffer = new Set<number>()
  constructor(public heap: Heap, public instructions: Instruction[]) {}

  get_all_env(addr: number, vis: Set<number>, envs: Set<number>) {
    if (addr === -1) return
    vis.add(addr)
    const val = this.heap.get_value(addr)
    if (val instanceof EnvironmentNode) envs.add(addr)
    const children = val.get_children()
    for (const child of children) {
      if (!vis.has(child)) this.get_all_env(child, vis, envs)
    }
  }

  dfs_env(
    env: number,
    adj: Map<number, number[]>,
    cur: number,
  ): EnvironmentInfo {
    // Sort the env by allocation time and get their envInfo
    const child_envs = (adj.get(env) || [])
      .map((child) => {
        return [this.env_alloc_map.get(child) || -1, child]
      })
      .sort((a, b) => a[0] - b[0])
      .map((x) => x[1])
      .map((child) => this.dfs_env(child, adj, cur))
    const env_node = new EnvironmentNode(this.heap, env)
    const var_info = env_node
      .get_frame()
      .get_children()
      .map((val, idx) => {
        return {
          name: (this.identifier_map.get(env) || [])[idx],
          val: this.heap.get_value(val).toString(),
          modified: this.modified_buffer.has(val),
        } as VarInfo
      })
    return {
      name: this.env_name_map.get(env),
      vars: var_info,
      alloc_time: this.env_alloc_map.get(env),
      children: child_envs,
      cur: env === cur,
    } as EnvironmentInfo
  }

  generate_state() {
    const contexts = [
      ...this.heap.contexts.list().get_children(),
      ...this.heap.blocked_contexts.get_items(),
    ].map((x) => new ContextNode(this.heap, x))
    const state: ContextInfo[] = []
    for (const context of contexts) {
      const OS = context
        .OS()
        .list()
        .get_children()
        .map((x) => {
          return {
            val: this.heap.get_value(x).toString(),
            addr: x,
          } as OSInfo
        })
      const instrs = []
      let lo = 0,
        hi = this.instructions.length - 1
      if (context.PC() < 3) {
        lo = 0
        hi = 7
      } else if (context.PC() + 3 >= this.instructions.length) {
        lo = this.instructions.length - 7
        hi = this.instructions.length - 1
      } else {
        lo = context.PC() - 3
        hi = context.PC() + 3
      }
      for (let i = lo; i <= hi; i++) {
        instrs.push({
          val: this.instructions[i].tag, // !TODO: More meaningful instruction strings
          idx: i,
          cur: i === context.PC(),
        })
      }
      const envs = new Set<number>()
      const vis = new Set<number>()
      this.get_all_env(context.addr, vis, envs)
      const adj = new Map<number, number[]>()
      for (const env of envs) adj.set(env, [])
      let global_env = 0
      for (const env of envs) {
        const envNode = new EnvironmentNode(this.heap, env)
        const par = envNode.get_parent(0)
        if (par) adj.get(par.addr)?.push(envNode.addr)
        else global_env = env
      }

      const env_info = this.dfs_env(global_env, adj, context.E().addr)

      state.push({
        OS,
        id: this.context_id_map.get(context.addr) || -1,
        addr: context.addr,
        blocked: context.is_blocked(),
        instrs,
        envs: env_info,
      })
    }
    this.data.push(state)
    this.modified_buffer.clear()
  }
}