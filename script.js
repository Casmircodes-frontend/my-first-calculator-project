

(function () {
  // ── DOM Elements ──
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const buttons = document.querySelectorAll(".btn");

  // ── Calculator State ──
  let currentOperand = "0"; // The number currently being typed
  let previousOperand = ""; // The previous number (before operator)
  let operator = null; // The pending operator (+, -, *, /, %)
  let shouldResetScreen = false; // Flag: next number press should reset the display
  let lastResult = null; // Store the last computed result for potential chaining
  let justEvaluated = false; // Flag: true right after pressing '='

  // ── Update Display ──
  function updateDisplay() {
    // Update the expression line (shows the full operation context)
    if (operator !== null && previousOperand !== "") {
      const opSymbol = getOperatorSymbol(operator);
      expressionEl.textContent = `${previousOperand} ${opSymbol}`;
    } else {
      expressionEl.textContent = "";
    }

    // Update the result line (shows the current operand)
    let displayValue = currentOperand;
    // Format the number for display (limit length)
    displayValue = formatDisplayNumber(displayValue);
    resultEl.textContent = displayValue;

    // Adjust font size based on length
    resultEl.classList.remove("small", "xsmall");
    const len = displayValue.replace(/[^0-9]/g, "").length;
    if (len > 12) {
      resultEl.classList.add("xsmall");
    } else if (len > 9) {
      resultEl.classList.add("small");
    }
  }

  function getOperatorSymbol(op) {
    switch (op) {
      case "+":
        return "+";
      case "-":
        return "−";
      case "*":
        return "×";
      case "/":
        return "÷";
      case "%":
        return "%";
      default:
        return op;
    }
  }

  function formatDisplayNumber(numStr) {
    // If it's an error message, return as-is
    if (
      numStr === "Error" ||
      numStr === "Infinity" ||
      numStr === "-Infinity" ||
      numStr === "NaN"
    ) {
      return "Error";
    }

    // If the number is too long, try to use exponential notation or truncate
    if (numStr.length > 15) {
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        // Use toPrecision to limit significant digits
        const formatted = num.toPrecision(10);
        // Remove trailing zeros after decimal in scientific notation
        return parseFloat(formatted).toString();
      }
    }

    // For decimal numbers, limit decimal places to avoid overflow
    if (numStr.includes(".")) {
      const parts = numStr.split(".");
      if (parts[1] && parts[1].length > 10) {
        const num = parseFloat(numStr);
        if (!isNaN(num)) {
          return num.toFixed(10).replace(/\.?0+$/, "");
        }
      }
    }

    return numStr;
  }

  // ── Core Calculator Logic ──
  function appendNumber(number) {
    if (justEvaluated) {
      // After pressing '=', if user types a number, start a fresh calculation
      currentOperand = number;
      previousOperand = "";
      operator = null;
      justEvaluated = false;
      shouldResetScreen = false;
      updateDisplay();
      return;
    }

    if (shouldResetScreen) {
      currentOperand = number;
      shouldResetScreen = false;
    } else {
      // Prevent multiple leading zeros
      if (currentOperand === "0" && number !== ".") {
        currentOperand = number;
      } else {
        // Prevent multiple decimal points
        if (number === "." && currentOperand.includes(".")) {
          return;
        }
        // Limit input length
        if (currentOperand.replace(/[^0-9]/g, "").length >= 15) {
          return;
        }
        currentOperand += number;
      }
    }

    updateDisplay();
  }

  function appendDecimal() {
    appendNumber(".");
  }

  function chooseOperator(op) {
    // If user just evaluated and now presses an operator, continue with the result
    if (justEvaluated) {
      justEvaluated = false;
      previousOperand = currentOperand;
      operator = op;
      shouldResetScreen = true;
      updateDisplay();
      return;
    }

    // If there's already a pending operator and the user hasn't typed a new number,
    // just change the operator
    if (
      operator !== null &&
      shouldResetScreen &&
      currentOperand === previousOperand
    ) {
      operator = op;
      updateDisplay();
      return;
    }

    // If there's a pending operator, compute the intermediate result first
    if (operator !== null && !shouldResetScreen) {
      const result = compute();
      if (result === null) return; // Error occurred
      currentOperand = result;
      previousOperand = result;
    } else {
      previousOperand = currentOperand;
    }

    operator = op;
    shouldResetScreen = true;
    updateDisplay();
  }

  function compute() {
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);

    if (isNaN(prev) || isNaN(current)) return null;

    let result;
    switch (operator) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*":
        result = prev * current;
        break;
      case "/":
        if (current === 0) {
          showError();
          return null;
        }
        result = prev / current;
        break;
      case "%":
        result = prev % current;
        break;
      default:
        return null;
    }

    // Handle floating point precision
    result = parseFloat(result.toPrecision(12));

    // Check for overflow
    if (!isFinite(result)) {
      showError();
      return null;
    }

    return result.toString();
  }

  function handleEquals() {
    if (justEvaluated) {
      // If user presses '=' repeatedly, do nothing special
      // They can press operator to chain
      return;
    }

    if (operator === null) {
      // No operator pending, just update display
      justEvaluated = true;
      updateDisplay();
      return;
    }

    if (shouldResetScreen && previousOperand !== "") {
      // User pressed operator then '=' without typing a new number
      // Use the previous operand as both operands (e.g., 5 + = → 5 + 5 = 10)
      currentOperand = previousOperand;
    }

    const result = compute();
    if (result === null) return; // Error occurred

    // Build expression for display
    const opSymbol = getOperatorSymbol(operator);
    expressionEl.textContent = `${previousOperand} ${opSymbol} ${currentOperand} =`;

    currentOperand = result;
    previousOperand = "";
    operator = null;
    shouldResetScreen = true;
    justEvaluated = true;
    lastResult = result;

    updateDisplay();
  }

  function showError() {
    currentOperand = "Error";
    previousOperand = "";
    operator = null;
    shouldResetScreen = true;
    justEvaluated = false;
    updateDisplay();

    // Auto-clear error after 1.5 seconds
    setTimeout(() => {
      if (currentOperand === "Error") {
        clearAll();
      }
    }, 1500);
  }

  function clearAll() {
    currentOperand = "0";
    previousOperand = "";
    operator = null;
    shouldResetScreen = false;
    justEvaluated = false;
    lastResult = null;
    updateDisplay();
  }

  function deleteLast() {
    if (justEvaluated) {
      // After '=', delete clears everything
      clearAll();
      return;
    }

    if (shouldResetScreen) {
      // If we're about to type a new number, delete cancels that and restores previous
      currentOperand = previousOperand || "0";
      previousOperand = "";
      operator = null;
      shouldResetScreen = false;
      updateDisplay();
      return;
    }

    // Remove last character
    if (currentOperand.length === 1) {
      currentOperand = "0";
    } else {
      currentOperand = currentOperand.slice(0, -1);
      // Handle case where we delete a negative sign leaving just '-'
      if (currentOperand === "-") {
        currentOperand = "0";
      }
    }

    updateDisplay();
  }

  function handlePercentage() {
    // Convert current operand to percentage of previous operand or itself
    const current = parseFloat(currentOperand);
    if (isNaN(current)) return;

    let result;
    if (previousOperand !== "" && operator !== null && !shouldResetScreen) {
      // e.g., 200 + 10% → 10% of 200 = 20, so result becomes 20
      const prev = parseFloat(previousOperand);
      if (!isNaN(prev)) {
        result = (prev * current) / 100;
      } else {
        result = current / 100;
      }
    } else {
      result = current / 100;
    }

    result = parseFloat(result.toPrecision(12));
    if (!isFinite(result)) {
      showError();
      return;
    }
    currentOperand = result.toString();
    updateDisplay();
  }

  // ── Event Handling ──
  function handleButtonClick(btn) {
    const action = btn.dataset.action;
    const value = btn.dataset.value;

    // Add a subtle ripple effect class (visual feedback)
    btn.style.transform = "scale(0.92)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 100);

    switch (action) {
      case "number":
        if (value === ".") {
          appendDecimal();
        } else {
          appendNumber(value);
        }
        break;
      case "operator":
        if (value === "%") {
          handlePercentage();
        } else {
          chooseOperator(value);
        }
        break;
      case "equals":
        handleEquals();
        break;
      case "clear":
        clearAll();
        break;
      case "delete":
        deleteLast();
        break;
      default:
        break;
    }
  }

  // ── Button Click Listeners ──
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => handleButtonClick(btn));
  });

  // ── Keyboard Support ──
  document.addEventListener("keydown", (e) => {
    const key = e.key;
    let targetBtn = null;

    // Prevent default for calculator keys
    if (
      /^[0-9.]$/.test(key) ||
      [
        "+",
        "-",
        "*",
        "/",
        "%",
        "Enter",
        "=",
        "Backspace",
        "Delete",
        "Escape",
        "c",
        "C",
      ].includes(key)
    ) {
      e.preventDefault();
    }

    // Map keyboard keys to buttons
    if (key >= "0" && key <= "9") {
      targetBtn = document.querySelector(`.btn[data-value="${key}"]`);
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === ".") {
      targetBtn = document.querySelector('.btn[data-value="."]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "+") {
      targetBtn = document.querySelector('.btn[data-value="+"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "-") {
      targetBtn = document.querySelector('.btn[data-value="-"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "*") {
      targetBtn = document.querySelector('.btn[data-value="*"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "/") {
      targetBtn = document.querySelector('.btn[data-value="/"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "%") {
      targetBtn = document.querySelector('.btn[data-value="%"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "Enter" || key === "=") {
      targetBtn = document.querySelector('.btn[data-action="equals"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "Backspace") {
      targetBtn = document.querySelector('.btn[data-action="delete"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "Delete") {
      // Delete key acts as clear all
      targetBtn = document.querySelector('.btn[data-action="clear"]');
      if (targetBtn) handleButtonClick(targetBtn);
    } else if (key === "Escape" || key === "c" || key === "C") {
      targetBtn = document.querySelector('.btn[data-action="clear"]');
      if (targetBtn) handleButtonClick(targetBtn);
    }
  });

  // ── Initialize Display ──
  updateDisplay();

  console.log("🧮 Calculator ready!");
  console.log("   Click buttons or use keyboard:");
  console.log("   Numbers (0-9), operators (+, -, *, /, %)");
  console.log("   Enter/= to calculate, Backspace to delete");
  console.log("   Escape/C to clear all");
})();
