import { Instruction } from './compiler/instructions'
import { StateInfo } from './executor/debugger'
import parser from './parser/parser'
import { SourceFileToken } from './parser/tokens'
import { compile_tokens, CompileError } from './compiler'
import { execute_instructions } from './executor'

interface InstructionData {
  val: string
}

interface ProgramData {
  output?: string
  instructions: InstructionData[]
  error?: {
    message: string
    type: 'parse' | 'compile' | 'runtime'
    details?: Error | string
  }
  visualData: StateInfo[]
}

const runCode = (
  source_code: string,
  heapsize: number,
  visualisation = true,
): ProgramData => {
  // Parsing.
  let tokens: SourceFileToken
  try {
    tokens = parser.parse(source_code) as SourceFileToken
    console.log(tokens)
  } catch (err) {
    return {
      instructions: [],
      output: 'Syntax Error!',
      error: {
        message: `${err as string}`,
        type: 'parse',
        details: err as string,
      },
      visualData: [],
    }
  }

  // Compilation.
  let instructions: Instruction[] = []
  try {
    instructions = compile_tokens(tokens)
    console.log(instructions)
  } catch (err) {
    return {
      instructions: [],
      output: 'Compilation Error!',
      error: {
        message: `Compilation Error:\n${err as CompileError}`,
        type: 'compile',
        details: err as CompileError,
      },
      visualData: [],
    }
  }

  // Execution.
  const result = execute_instructions(instructions, heapsize, visualisation)
  if (result.errorMessage) {
    console.warn(result.errorMessage)
    return {
      instructions: [],
      output: 'Runtime Error!',
      error: {
        message: result.errorMessage,
        type: 'runtime',
        details: result.errorMessage,
      },
      visualData: [],
    }
  }

  return {
    instructions: [],
    output: result.stdout,
    visualData: result.visual_data,
    error: undefined,
  }
}

export { type InstructionData, type ProgramData, runCode }
