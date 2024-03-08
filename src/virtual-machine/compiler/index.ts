type OpInstruction = {
    tag: 'BINOP' |  'UNOP',
    op: string
}

type LoadConstantInstruction = {
    tag: 'LDC',
    val: unknown
}

type DoneInstruction = {
    tag: 'DONE'
}


type Instruction = OpInstruction | LoadConstantInstruction | DoneInstruction

class Compiler{
    instructions: Instruction[] = []
    compile(token: Token){
        switch(token.type){
            case 'binary_operator': 
                this.compile(token.children[0])
                this.compile(token.children[1])
                this.instructions.push({tag:'BINOP', op: token.name})
                break
            case 'unary_operator': 
                this.compile(token.children[0])
                this.instructions.push({tag: 'UNOP', op: token.name})
                break
            case 'literal':
                this.instructions.push({tag: 'LDC', val: token.value})
                break
        }
    }

    compile_program(token : Token){
        this.compile(token)
        this.instructions.push({tag: 'DONE'})
    }
}

const compile_tokens = (token: Token) => {
    const compiler = new Compiler()
    compiler.compile_program(token)
    return compiler.instructions
}

export {compile_tokens, type Instruction, type LoadConstantInstruction, type OpInstruction}