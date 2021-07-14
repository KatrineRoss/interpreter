const resultField = document.getElementsByClassName('result-field')?.[0];
const clearBtn = document.getElementsByClassName('expression-input__clear-btn')?.[0];

const isFirstOrderOperationSign = (char) => '/*'.includes(char);
const isSecondOrderOperationSign = (char) => '-+'.includes(char);
const isOperationSign = (char) => '/*+-'.includes(char);

const isInteger = (char) => '0123456789'.includes(char);

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
    NEED_OPERATION_SIGN: 'NEED_OPERATION_SIGN',
    NEED_CLOSING_PARENTHESIS: 'NEED_CLOSING_PARENTHESIS',
});

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

const TOKEN_TYPES = Object.freeze({
    INTEGER: 'INTEGER',
    PLUS: '+',
    MINUS: '-',
    MULT: '*',
    DIV: '/',
    PAREN_L: '(',
    PAREN_R: ')',
});

class Token {
    constructor(value, type) {
        this.value = value;
        this.type = type;
    }
}

const BINARY_OPERATIONS = Object.freeze({
    ADD: '+',
    SUBSTRACT: '-',
    MULTIPLY: '*',
    DIVISION: '/',
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
            const isNegative = expression[i-1] === TOKEN_TYPES.MINUS;

            if (isInteger(expression[i])) {
                const num = [];

                while (isInteger(expression[i])) {
                    num.push(expression[i]);
                    i++;
                }

                if (!isFirstOrder && isFirstOrderOperationSign(expression[i])) {
                    let subExpression = expression.slice(i - num.length);
                    // Firstly, look for 
                    // const firstRParenIndex = subExpression.search(/)/);
                    // const firstSecOrderOperationSignIndex = subExpression.search(/\+|-/);
                    // const endOfSubExpressionIndex = firstRParenIndex >= 0 ? firstRParenIndex : firstSecOrderOperationSignIndex;
                    const endOfSubExpressionIndex = findEndOfFirstOrderOperationIndex(subExpression);
                    
                    subExpression = subExpression.slice(0, endOfSubExpressionIndex >= 0 ? endOfSubExpressionIndex : undefined);

                    tokens.push(this._parse(isNegative ? `-${subExpression}` : subExpression, true));
                    // tokens.push(this._parse(subExpression, true));

                    i = endOfSubExpressionIndex >= 0 ? endOfSubExpressionIndex + i - 1 : expression.length;
                } else {
                    const avgNum = num.join('');
                    tokens.push(new Token(isNegative ? `-${avgNum}` : avgNum, TOKEN_TYPES.INTEGER));
                    // tokens.push(new Token(avgNum, TOKEN_TYPES.INTEGER));
                }
            }

            if (expression[i-1] && isOperationSign(expression[i])) {
                // if operation sign is minus replace it by pluse, because we already know if the integer is negative.
                const operation = expression[i] === TOKEN_TYPES.MINUS ? TOKEN_TYPES.PLUS : expression[i];
                // const operation = expression[i];

                tokens.push(new Token(operation, operation));
            }

            if (expression[i] === TOKEN_TYPES.PAREN_L) {
                // const parenRightIndex = expression.slice(i).search(/\)/);
                const parenRightIndex = findEndOfSubExpressionIndex(expression.slice(i));

                if (parenRightIndex === -1) {
                    throw new Error(getErrorMessage(ERRORS_TYPES.NEED_CLOSING_PARENTHESIS, expression[i]));
                } else {
                    const subExpression = expression.slice(i + 1, parenRightIndex + i);
                    tokens.push(this._parse(isNegative ? inverseExpression(subExpression) : subExpression));

                    i = parenRightIndex + i;
                }
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
            if (!isInteger(flatedTokensList[operationSignIndex].value)) {
                const bo = new BinaryOperation(new Integer(flatedTokensList[leftArgIndex]?.value), this._process(flatedTokensList, rightArgIndex), flatedTokensList[operationSignIndex].value);

                return new Integer(bo.value);
            }

            throw new Error(getErrorMessage(ERRORS_TYPES.NEED_OPERATION_SIGN, operationSignIndex))
        }
    }

    calculate(expression) {
        const tokens = this._parse(expression);
        
        return this._process(tokens);
    }
}

calculate = (form) => {
    const expression = form.getElementsByClassName('expression-input')?.[0]?.value;
    const ep = new ExpressionProcessor();
    const result = ep.calculate(expression);

    resultField.innerHTML = result.value;
};

const handleClearButtonClick = () => {
    resultField.innerHTML = '';
    clearBtn.style.opacity = '0';
};

const handleExpressionInputChange = (input) => {
    if (input.value.length > 0) {
        clearBtn.style.opacity = '1';
    } else {
        clearBtn.style.opacity = '0';
    }
}
