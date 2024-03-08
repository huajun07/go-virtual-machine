import parser from './parser/parser'

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
    const tokens = parser.parse(source_code)
    console.log(tokens)
  } catch (err) {
    console.warn(err)
  }
  return { returnVal: 'test', instructions: [], output: 'test3' }
}

export { type InstructionData, type ProgramData, runCode }
