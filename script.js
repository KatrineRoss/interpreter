const expressionInput = document.getElementsByClassName('expression-input')?.[0];
const resultField = document.getElementsByClassName('result-field')?.[0];
const errorsField = document.getElementsByClassName('errors-field')?.[0];
const calculateBtn = document.getElementsByClassName('calculate-button')?.[0];
const clearBtn = document.getElementsByClassName('expression-input__clear-btn')?.[0];

const TOKEN_TYPES = Object.freeze({
    INTEGER: 'INTEGER',
    OPERATION: 'OPERATION',
});

const OPERATION_TYPES = Object.freeze({
    PLUS: '+',
    MINUS: '-',
    MULTIPLICATION: '*',
    DIVISION: '/',
});

const PARENTHESIS_TYPES = Object.freeze({
    OPEN: '(',
    CLOSE: ')',
});

const isOperationSign = (char) => Object.keys(OPERATION_TYPES).map((key) => OPERATION_TYPES[key]).includes(char);
const isParenthesis = (char) => Object.keys(PARENTHESIS_TYPES).map((key) => PARENTHESIS_TYPES[key]).includes(char);
const isInteger = (char) => '0123456789'.includes(char);
const isFirstOrderOperationSign = (char) => '/*'.includes(char);
const isSecondOrderOperationSign = (char) => '-+'.includes(char);

const inverseExpression = (expression) => {
    let result = '';
    const isNegative = expression?.[0] === '-';

    for (index in expression) {
        switch(expression[index]) {
            case '+':
                result += '-';
                break;
            case '-':
                result += '+';
                break;
            default:
                result += expression[index];
        }
    }

    return isNegative ? result.slice(1) : `-${result}`;
}

const findEndOfFirstOrderOperationIndex = (expression, ) => {
    let closedParen = true;

    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
            closedParen = false;
        }

        if (expression[i] === ')') {
            closedParen = true;
        }

        if (isSecondOrderOperationSign(expression[i]) && closedParen) {
            return i;
        }
    }

    return -1;
};

const findEndOfSubExpressionIndex = (expression, ) => {
    let nestedExpressionNotClosed = 0;

    for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
            nestedExpressionNotClosed++;
        }

        if (expression[i] === ')' && nestedExpressionNotClosed === 1) {
            return i;
        }

        if (expression[i] === ')') {
            nestedExpressionNotClosed--;
        }
    }

    return -1;
};

const ERRORS_TYPES = Object.freeze({
    OPERAND_REQUIRED: 'OPERAND_REQUIRED',
    OPERATION_REQUIRED: 'OPERATION_REQUIRED',
    CLOSING_PARENTHESIS_REQUIRED: 'CLOSING_PARENTHESIS_REQUIRED',
    OPEN_PARENTHESIS_REQUIRED: 'OPEN_PARENTHESIS_REQUIRED',
    UNRESOLVED_SYMBOL: 'UNRESOLVED_SYMBOL',
});


class ValidationError {
    constructor(type, position) {
        this.type = type;
        this.position = position;
    }

    get message() {
        switch (this.type) {
            case ERRORS_TYPES.OPERAND_REQUIRED:
                return `Operand required at position [${this.position}]!`;
            case ERRORS_TYPES.OPERATION_REQUIRED:
                return `Operation sign required at position [${this.position}]!`;
            case ERRORS_TYPES.CLOSING_PARENTHESIS_REQUIRED:
                return `Closing parenthesis for [${this.position}] required!`;
            case ERRORS_TYPES.OPEN_PARENTHESIS_REQUIRED:
                return `Open parenthesis for [${this.position}] required!`;
            case ERRORS_TYPES.UNRESOLVED_SYMBOL:
                return `Unresolved symbol detected at [${this.position}]`;
            default:
                return 'There is an error in your expression!';
        }
    }
};

class Validator {
    constructor() {
        this._errors = [];
    }

    validate(expression) {
        let openParenIndexes = [];

        if (!!expression) {
            for (let i = 0; i < expression.length; i++) {
                const index = i + 1;
                // Check if the char is resolved.
                if (!(isInteger(expression[i]) || isOperationSign(expression[i]) || isParenthesis(expression[i]))) {
                    this._errors.push(new ValidationError(ERRORS_TYPES.UNRESOLVED_SYMBOL, index));
                }
    
                if (isOperationSign(expression[i])  && (!isInteger(expression[i+1]) && !isParenthesis(expression[i+1]))) {
                    this._errors.push(new ValidationError(ERRORS_TYPES.OPERAND_REQUIRED, index+1));
                }
    
                if (expression[i] === '(') {
                    openParenIndexes.push(index);

                    if (expression[i - 1] !== undefined && !isOperationSign(expression[i - 1])) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPERATION_REQUIRED, index));
                    }

                    if (expression[i + 1] !== undefined && !isSecondOrderOperationSign(expression[i + 1]) && isOperationSign(expression[i + 1])) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPERATION_REQUIRED, index + 1));
                    }
                }
    
                // Check if right parenthesis has a left pair.
                // If there already is an open parenthesis (i.e. openParenIndexes is not empty), then it's ok and we can pop openParenIndexes.
                if (expression[i] === ')') {
                    if (isOperationSign(expression[i - 1])) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPERAND_REQUIRED, index));
                    }

                    if (expression[i + 1] !== undefined && !isOperationSign(expression[i + 1])) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPERATION_REQUIRED, index + 1));
                    }

                    if (openParenIndexes.length === 0) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPEN_PARENTHESIS_REQUIRED, index));
                    } else {
                        openParenIndexes.pop();
                    }

                    if (expression[i-1] === PARENTHESIS_TYPES.OPEN) {
                        this._errors.push(new ValidationError(ERRORS_TYPES.OPERAND_REQUIRED, index+1));
                    }
                }
            }
    
            // Check if any left parenthesis has no right pair.
            // An error appears if openParenIndexes is not discarded (closing parenthesis hasn't found).
            if (!!openParenIndexes.length > 0) {
                this._errors.push(new ValidationError(ERRORS_TYPES.CLOSING_PARENTHESIS_REQUIRED, openParenIndexes.pop()));
            }
        }

        return this;
    }

    get errors() {
        return [...this._errors];
    }
}

const getErrorMessage = (type, position) => {
    switch (type) {
        case ERRORS_TYPES.NEED_OPERATION_SIGN:
            return `Operation sign needed at position [${position}]!`;
        case ERRORS_TYPES.NEED_CLOSING_PARENTHESIS:
            return `Closing parenthesis for [${position}] needed!`;
        default:
            return 'There is an error in your expression!';
    }
}

class Integer {
    constructor(value) {
        this._value = Number(value);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = Number(newValue);
    }
}

class Token {
    constructor(value, type) {
        this.value = value;
        this.type = type;
    }
}

const BINARY_OPERATIONS = Object.freeze({
    ADD: OPERATION_TYPES.PLUS,
    SUBSTRACT: OPERATION_TYPES.MINUS,
    MULTIPLY: OPERATION_TYPES.MULTIPLICATION,
    DIVISION: OPERATION_TYPES.DIVISION,
});

class BinaryOperation {
    constructor(left, right, type) {
        this._left = left;
        this._right = right;
        this._type = type;
    }

    set left(integer) {
        this._left = integer;
    }

    get left() {
        return this._left;
    }

    set right(integer) {
        this._right = integer;
    }

    get right() {
        return this._right;
    }

    set type(integer) {
        this._type = integer;
    }
    get type() {
        return this._type;
    }

    get value() {
        switch(this.type) {
            case BINARY_OPERATIONS.ADD:
                return this.left.value + this.right.value;
            case BINARY_OPERATIONS.SUBSTRACT:
                return this.left.value - this.right.value;
            case BINARY_OPERATIONS.DIVISION:
                return this.left.value / this.right.value;
            case BINARY_OPERATIONS.MULTIPLY:
                return this.left.value * this.right.value;
        }
    }
}

class ExpressionProcessor {
    _parse(expression, isFirstOrder = false) {
        const tokens = [];

        for (let i = 0; i < expression.length; i++) {
            const isNegative = expression[i-1] === OPERATION_TYPES.MINUS;

            if (isInteger(expression[i])) {
                const num = [];

                while (isInteger(expression[i])) {
                    num.push(expression[i]);
                    i++;
                }

                if (!isFirstOrder && isFirstOrderOperationSign(expression[i])) {
                    let subExpression = expression.slice(i - num.length);
                    const endOfSubExpressionIndex = findEndOfFirstOrderOperationIndex(subExpression);
                    
                    subExpression = subExpression.slice(0, endOfSubExpressionIndex >= 0 ? endOfSubExpressionIndex : undefined);

                    tokens.push(this._parse(isNegative ? `-${subExpression}` : subExpression, true));

                    i = endOfSubExpressionIndex >= 0 ? endOfSubExpressionIndex + i - 1 : expression.length;
                } else {
                    const avgNum = num.join('');

                    tokens.push(new Token(isNegative ? `-${avgNum}` : avgNum, TOKEN_TYPES.INTEGER));
                }
            }

            if (expression[i-1] && isOperationSign(expression[i])) {
                // if operation sign is minus replace it by pluse, because we already know if the integer is negative.
                const operation = expression[i] === OPERATION_TYPES.MINUS ? OPERATION_TYPES.PLUS : expression[i];

                tokens.push(new Token(operation, TOKEN_TYPES.OPERATION));
            }

            if (expression[i] === PARENTHESIS_TYPES.OPEN) {
                const parenRightIndex = findEndOfSubExpressionIndex(expression.slice(i));
                const subExpression = expression.slice(i + 1, parenRightIndex + i);

                tokens.push(this._parse(isNegative ? inverseExpression(subExpression) : subExpression));

                i = parenRightIndex + i;
            }
        }

        return tokens;
    }

    _process(tokens, index = 0) {
        const hasSubExpression = tokens.some((token) => Array.isArray(token));
        const flatedTokensList = hasSubExpression ? tokens.map((token) => {
            if (Array.isArray(token)) {
                return this._process(token);
            }

            return token;
        }) : [...tokens];
        const leftArgIndex = index;
        const rightArgIndex = index + 2;
        const operationSignIndex = index + 1;

        if (index >= flatedTokensList.length - 1) {
            return new Integer(flatedTokensList[leftArgIndex]?.value);
        }

        /**
         * If has an operation sign [1] and a left arg [2] - create binary operation and process it recursively.
         */
        if (flatedTokensList[operationSignIndex]) {
            const bo = new BinaryOperation(new Integer(flatedTokensList[leftArgIndex]?.value), this._process(flatedTokensList, rightArgIndex), flatedTokensList[operationSignIndex].value);

            return new Integer(bo.value);
        }
    }

    calculate(expression) {
        const tokens = this._parse(expression);
        
        return this._process(tokens);
    }
}

const clearErrorsField = () => {
    errorsField.innerHTML = '';
    errorsField.classList.add('errors-field--disabled');
};

const clearResultField = () => {
    resultField.innerHTML = '';
};

calculate = (form) => {
    const expression = form.getElementsByClassName('expression-input')?.[0]?.value;
    const v = new Validator();
    clearResultField();
    clearErrorsField();
    const errors = v.validate(expression).errors;

    if (errors.length > 0) {
        const newListElem = document.createElement('ul');

        for (index in errors) {
            const newElem = document.createElement('li');

            newElem.innerHTML = errors[index].message;

            newListElem.appendChild(newElem);
        }

        expressionInput.classList.add('expression-input--invalid');
        errorsField.appendChild(newListElem);
        errorsField.classList.remove('errors-field--disabled');
    } else {
        const ep = new ExpressionProcessor();
        const result = ep.calculate(expression);
    
        expressionInput.classList.remove('expression-input--invalid');
        resultField.innerHTML = result.value;
    }
};

const clearForm = () => {
    clearResultField();
    clearErrorsField();
    clearBtn.style.opacity = '0';
    calculateBtn.setAttribute('disabled', true);
}

const handleClearButtonClick = () => {
    clearForm();
};

const removeUnresolvedChars = (string) => {
    let result = "";

    if (string !== null) {
        for (let index in string) {
            if (isInteger(string[index]) || isOperationSign(string[index]) || isParenthesis(string[index])) {
                result += string[index];
            }
        }
    }

    return result;
}

const maskExpressionInput = (inputData) => {
    const inputValue = expressionInput.value;

    if (inputData !== null && !(isInteger(inputData) || isOperationSign(inputData) || isParenthesis(inputData))) {
        const indexOfUnresolvedChar = inputValue.indexOf(inputData);
        expressionInput.value = inputValue.slice(0, indexOfUnresolvedChar) + inputValue.slice(indexOfUnresolvedChar + 1);
    } else if (inputData === null && inputValue !== "") {
        expressionInput.value = removeUnresolvedChars(inputValue);
    }
}

const handleInput = (event) => {
    maskExpressionInput(event.data);

    if (expressionInput.value.length > 0) {
        clearErrorsField();
        clearBtn.style.opacity = '1';
        calculateBtn.removeAttribute('disabled');
    } else {
        clearForm();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    expressionInput.addEventListener('input', handleInput);
});
