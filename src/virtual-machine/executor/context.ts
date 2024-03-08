class Context{
    PC = 0
    OS: unknown[] = []

    pushOS(x : unknown){
        this.OS.push(x)
    }

    popOS(){
        return this.OS.pop()
    }

    printOS(){
        for(const item of this.OS){
            console.log(item)
        }
    }
}

export {Context}