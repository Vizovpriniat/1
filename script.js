class Calculator {
  constructor(previousOperandElement, currentOperandElement) {
    this.previousOperandElement = previousOperandElement;
    this.currentOperandElement = currentOperandElement;
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
  }

  delete() {
    if (this.currentOperand === 'Ошибка') {
      this.clear();
      return;
    }
    this.currentOperand = this.currentOperand.length === 1
      ? '0'
      : this.currentOperand.slice(0, -1);
  }

  appendNumber(number) {
    if (this.currentOperand === 'Ошибка') this.clear();
    if (this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }
    if (number === '.' && this.currentOperand.includes('.')) return;
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number;
    } else {
      this.currentOperand += number;
    }
  }

  chooseOperation(operation) {
    if (this.currentOperand === 'Ошибка') return;
    if (this.currentOperand === '' && this.previousOperand === '') return;

    if (this.previousOperand !== '' && !this.shouldResetScreen) {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
  }

  percent() {
    if (this.currentOperand === 'Ошибка' || this.currentOperand === '') return;
    this.currentOperand = (parseFloat(this.currentOperand) / 100).toString();
  }

  toggleSign() {
    if (this.currentOperand === 'Ошибка' || this.currentOperand === '0') return;
    this.currentOperand = this.currentOperand.startsWith('-')
      ? this.currentOperand.slice(1)
      : '-' + this.currentOperand;
  }

  compute() {
    if (this.operation === undefined || this.previousOperand === '') return;

    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);
    if (isNaN(prev) || isNaN(current)) return;

    let result;
    switch (this.operation) {
      case '+':
        result = prev + current;
        break;
      case '−':
        result = prev - current;
        break;
      case '×':
        result = prev * current;
        break;
      case '÷':
        if (current === 0) {
          this.currentOperand = 'Ошибка';
          this.previousOperand = '';
          this.operation = undefined;
          this.shouldResetScreen = true;
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    result = Math.round((result + Number.EPSILON) * 1e10) / 1e10;

    this.currentOperand = result.toString();
    this.operation = undefined;
    this.previousOperand = '';
    this.shouldResetScreen = true;
  }

  formatNumber(numberString) {
    if (numberString === 'Ошибка' || numberString === '') return numberString;
    const isNegative = numberString.startsWith('-');
    const unsigned = isNegative ? numberString.slice(1) : numberString;
    const [integerPart, decimalPart] = unsigned.split('.');

    const integerDisplay = integerPart === ''
      ? '0'
      : new Intl.NumberFormat('ru-RU').format(Number(integerPart));

    let result = (isNegative ? '-' : '') + integerDisplay;
    if (decimalPart !== undefined) {
      result += ',' + decimalPart;
    }
    return result;
  }

  updateDisplay() {
    this.currentOperandElement.textContent = this.formatNumber(this.currentOperand);
    this.previousOperandElement.textContent = this.operation != null
      ? `${this.formatNumber(this.previousOperand)} ${this.operation}`
      : '';
  }
}

const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

document.querySelectorAll('[data-number]').forEach((button) => {
  button.addEventListener('click', () => {
    calculator.appendNumber(button.dataset.number);
    calculator.updateDisplay();
  });
});

document.querySelectorAll('[data-operator]').forEach((button) => {
  button.addEventListener('click', () => {
    calculator.chooseOperation(button.dataset.operator);
    calculator.updateDisplay();
  });
});

document.getElementById('decimal').addEventListener('click', () => {
  calculator.appendNumber('.');
  calculator.updateDisplay();
});

document.getElementById('equals').addEventListener('click', () => {
  calculator.compute();
  calculator.updateDisplay();
});

document.getElementById('clear').addEventListener('click', () => {
  calculator.clear();
  calculator.updateDisplay();
});

document.getElementById('delete').addEventListener('click', () => {
  calculator.delete();
  calculator.updateDisplay();
});

document.getElementById('percent').addEventListener('click', () => {
  calculator.percent();
  calculator.updateDisplay();
});

document.getElementById('sign').addEventListener('click', () => {
  calculator.toggleSign();
  calculator.updateDisplay();
});

const KEY_TO_OPERATOR = { '-': '−', '*': '×', '/': '÷', '+': '+' };

window.addEventListener('keydown', (event) => {
  if (event.key >= '0' && event.key <= '9') {
    calculator.appendNumber(event.key);
  } else if (event.key === '.' || event.key === ',') {
    calculator.appendNumber('.');
  } else if (event.key in KEY_TO_OPERATOR) {
    if (event.key === '/') event.preventDefault();
    calculator.chooseOperation(KEY_TO_OPERATOR[event.key]);
  } else if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault();
    calculator.compute();
  } else if (event.key === 'Backspace') {
    calculator.delete();
  } else if (event.key === 'Escape') {
    calculator.clear();
  } else if (event.key === '%') {
    calculator.percent();
  } else {
    return;
  }
  calculator.updateDisplay();
});
