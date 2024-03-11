import parser from './parser/parser'
import { compile_tokens } from './compiler'
import { execute_instructions } from './executor'

interface InstructionData {
  val: string
}

interface ProgramData {
  output?: string
  instructions: InstructionData[]
  errorMessage?: string
  returnVal: string
}

const runCode = (source_code: string, heapsize: number): ProgramData => {
  try {
    const tokens = parser.parse(source_code) as Token
    // console.log(tokens)
    const instructions = compile_tokens(tokens)
    // console.log(instructions)
    const result = execute_instructions(instructions, heapsize)
    // console.log(result)
    return {
      returnVal: 'test',
      instructions: [],
      output: JSON.stringify(result),
    }
  } catch (err) {
    console.warn(err)
  }
  return { returnVal: 'test', instructions: [], output: 'An Error Occurred!' }
}

export { type InstructionData, type ProgramData, runCode }
