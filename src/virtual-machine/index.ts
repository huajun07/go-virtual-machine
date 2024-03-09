import parser from './parser/parser'
import { compile_tokens } from './compiler'
import { executor_instructions } from './executor'

interface InstructionData {
  val: string
}

interface ProgramData {
  output?: string
  instructions: InstructionData[]
  errorMessage?: string
  returnVal: string
}

const runCode = (source_code: string): ProgramData => {
  try {
    const tokens = parser.parse(source_code) as Token
    // console.log(tokens)
    const instructions = compile_tokens(tokens)
    // console.log(instructions)
    const result = executor_instructions(instructions)
    // console.log(result)
    return {
      returnVal: 'test',
      instructions: [],
      output: JSON.stringify(result),
    }
  } catch (err) {
    console.warn(err)
  }
  return { returnVal: 'test', instructions: [], output: 'test3' }
}

export { type InstructionData, type ProgramData, runCode }
