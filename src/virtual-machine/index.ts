import { StateInfo } from './executor/debugger'
import parser from './parser/parser'
import { SourceFileToken } from './parser/tokens'
import { compile_tokens } from './compiler'
import { execute_instructions } from './executor'

interface InstructionData {
  val: string
}

interface ProgramData {
  output?: string
  instructions: InstructionData[]
  errorMessage?: string
  visualData: StateInfo[]
}

const runCode = (
  source_code: string,
  heapsize: number,
  visualisation = true,
): ProgramData => {
  let errorMessage = ''
  try {
    const tokens = parser.parse(source_code) as SourceFileToken
    console.log(tokens)
    const instructions = compile_tokens(tokens)
    console.log(instructions)
    const result = execute_instructions(instructions, heapsize, visualisation)
    // console.log(result)
    // console.log(result.visual_data)
    return {
      instructions: [],
      output: result.stdout,
      visualData: result.visual_data,
    }
  } catch (err) {
    console.warn(err)
    if (err instanceof Error) errorMessage = err.message
  }
  return {
    instructions: [],
    output: 'An Error Occurred!',
    errorMessage: errorMessage,
    visualData: [],
  }
}

export { type InstructionData, type ProgramData, runCode }
