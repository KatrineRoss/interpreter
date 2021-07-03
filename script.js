class Integer {
    constructor(value) {
        this.value = value;
    }

    get value() {
        return this.value;
    }

    set value(newValue) {
        this.value = newValue;
    }
}

const TOKEN_TYPES = Object.freeze({
    INTEGER: 'INTEGER',
    VARIABLE: 'VARIABLE',
    PLUS: 'PLUS',
    MINUS: 'MINUS',
    PAREN_R: 'PAREN_R',
    PAREN_L: 'PAREN_L',
});

class Token {
    constructor(text, type) {
        this.text = text;
        this.type = type;
    }
}

const BINARY_OPERATIONS_TYPES = Object.freeze({
    ADD: 'ADD',
    SUBSTRACT: 'SUBSTRACT',
});

class BinaryOperation {
    constructor(left, right, type) {
        this.left = left;
        this.right = right;
        this.type = type;
    }

    get value() {
        switch(this.type) {
            case BINARY_OPERATIONS_TYPES.ADD:
                return this.left + this.right;
            case BINARY_OPERATIONS_TYPES.SUBSTRACT:
                return this.left - this.right;
        }
    }
}

calculate = (form) => {
    const resultFieled = form.getElementsByClassName('result-field')?.[0];

    resultFieled.innerHTML = 'YEAH!';
    console.log('YEAH!');
};
