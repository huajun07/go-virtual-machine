interface InstructionData {
    val: string
}

interface ProgramData {
    output?: string
    instructions: InstructionData[]
    errorMessage?: string
    returnVal: string
}


const runCode = (_program_code  : string): ProgramData => {
    return {returnVal: "test", instructions: [], output: 'test'}
}

export {type InstructionData, type ProgramData, runCode}