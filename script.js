const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const yearLabel = document.querySelector("#year");

const storageKey = "campusmint-budget";
const defaultState = {
  income: 0,
  goal: 0,
  expenses: [],
};

const budgetForm = document.querySelector("#budget-form");
const expenseForm = document.querySelector("#expense-form");
const resetButton = document.querySelector("#reset-button");

const incomeInput = document.querySelector("#income-input");
const goalInput = document.querySelector("#goal-input");
const expenseNameInput = document.querySelector("#expense-name");
const expenseAmountInput = document.querySelector("#expense-amount");
const expenseCategoryInput = document.querySelector("#expense-category");
const expenseReasonInput = document.querySelector("#expense-reason");

const incomeTotal = document.querySelector("#income-total");
const spentTotal = document.querySelector("#spent-total");
const savedTotal = document.querySelector("#saved-total");
const remainingTotal = document.querySelector("#remaining-total");
const heroBalance = document.querySelector("#hero-balance");
const heroGoal = document.querySelector("#hero-goal");
const goalStatus = document.querySelector("#goal-status");
const decisionTitle = document.querySelector("#decision-title");
const decisionText = document.querySelector("#decision-text");
const decisionBadge = document.querySelector("#decision-badge");
const categoryList = document.querySelector("#category-list");
const expenseList = document.querySelector("#expense-list");
const budgetChart = document.querySelector("#budget-chart");
const chartSpent = document.querySelector("#chart-spent");
const chartGoal = document.querySelector("#chart-goal");
const chartSafe = document.querySelector("#chart-safe");
const budgetStatusTitle = document.querySelector("#budget-status-title");
const budgetStatusText = document.querySelector("#budget-status-text");
const budgetStatusBadge = document.querySelector("#budget-status-badge");
const barChart = document.querySelector("#bar-chart");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return { ...defaultState };
    }
    const parsed = JSON.parse(raw);
    return {
      income: Number(parsed.income) || 0,
      goal: Number(parsed.goal) || 0,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    };
  } catch {
    return { ...defaultState };
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getSpentTotal() {
  return state.expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function getSavedAmount() {
  const spent = getSpentTotal();
  const saved = state.income - spent;
  return saved > 0 ? saved : 0;
}

function getRemainingSafeToSpend() {
  const saved = getSavedAmount();
  const safe = saved - state.goal;
  return safe > 0 ? safe : 0;
}

function getGoalProgress() {
  if (state.goal <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((getSavedAmount() / state.goal) * 100));
}

function getCategoryTotals() {
  const totals = {};
  state.expenses.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount || 0);
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function getDecision(expense) {
  const amount = Number(expense.amount || 0);
  const reason = expense.reason;
  const remaining = getRemainingSafeToSpend();

  if (reason === "Need" || reason === "Long-term value") {
    return {
      title: "This looks aligned with your real needs.",
      text: "This purchase supports daily life or future progress. Keep it in budget and you are still moving well.",
      badge: "Looks like a need",
      badgeClass: "pill pill-need",
    };
  }

  if (reason === "Social pressure" || (reason === "Want" && amount > remaining)) {
    return {
      title: "Pause before spending this one.",
      text: "This looks more emotional than necessary right now. Waiting a day could protect your weekly budget.",
      badge: "High caution",
      badgeClass: "pill pill-caution",
    };
  }

  if (reason === "Urgent") {
    return {
      title: "Urgent spend detected.",
      text: "If this is truly urgent, log it and rebalance another category after. CampusMint is helping you respond, not panic.",
      badge: "Urgent",
      badgeClass: "pill pill-caution",
    };
  }

  return {
    title: "This looks like a want.",
    text: "It is okay to spend on fun sometimes, but check whether it pulls you away from rent, food, or your savings cushion.",
    badge: "Looks like a want",
    badgeClass: "pill pill-want",
  };
}

function renderSummary() {
  if (!incomeTotal || !spentTotal || !savedTotal || !remainingTotal || !heroBalance || !heroGoal || !goalStatus || !incomeInput || !goalInput) {
    return;
  }

  const spent = getSpentTotal();
  const saved = getSavedAmount();
  const remaining = getRemainingSafeToSpend();
  const progress = getGoalProgress();

  incomeTotal.textContent = formatCurrency(state.income);
  spentTotal.textContent = formatCurrency(spent);
  savedTotal.textContent = formatCurrency(saved);
  remainingTotal.textContent = formatCurrency(remaining);
  heroBalance.textContent = formatCurrency(remaining);
  heroGoal.textContent = `${progress}%`;
  goalStatus.textContent = state.goal > 0
    ? `${progress}% of ${formatCurrency(state.goal)} goal`
    : "Goal not set";

  incomeInput.value = state.income || "";
  goalInput.value = state.goal || "";
}

function renderChart() {
  if (!budgetChart || !chartSpent || !chartGoal || !chartSafe) {
    return;
  }

  const income = state.income;
  const spent = getSpentTotal();
  const safe = getRemainingSafeToSpend();
  const goalReserve = Math.min(state.goal, Math.max(income - spent, 0));
  const unallocated = Math.max(income - spent - goalReserve - safe, 0);
  const total = Math.max(income, spent + goalReserve + safe + unallocated, 1);

  const spentDeg = (spent / total) * 360;
  const goalDeg = (goalReserve / total) * 360;
  const safeDeg = (safe / total) * 360;
  const unallocatedDeg = Math.max(0, 360 - spentDeg - goalDeg - safeDeg);

  budgetChart.style.background = `conic-gradient(
    #ff7b54 0deg ${spentDeg}deg,
    #ffd86a ${spentDeg}deg ${spentDeg + goalDeg}deg,
    #12a594 ${spentDeg + goalDeg}deg ${spentDeg + goalDeg + safeDeg}deg,
    rgba(23, 50, 74, 0.12) ${spentDeg + goalDeg + safeDeg}deg ${spentDeg + goalDeg + safeDeg + unallocatedDeg}deg
  )`;

  chartSpent.textContent = formatCurrency(spent);
  chartGoal.textContent = formatCurrency(goalReserve);
  chartSafe.textContent = formatCurrency(safe);
}

function renderBudgetStatus() {
  if (!budgetStatusTitle || !budgetStatusText || !budgetStatusBadge) {
    return;
  }

  const income = state.income;
  const spent = getSpentTotal();
  const saved = getSavedAmount();
  const remaining = getRemainingSafeToSpend();

  if (income <= 0) {
    budgetStatusTitle.textContent = "Set your budget to start.";
    budgetStatusText.textContent = "Add your monthly income and savings goal first, then CampusMint can tell you whether you are on track.";
    budgetStatusBadge.textContent = "No budget yet";
    budgetStatusBadge.className = "pill pill-soft";
    return;
  }

  if (spent > income) {
    budgetStatusTitle.textContent = "You spent more than your monthly income.";
    budgetStatusText.textContent = "You are over your budget right now. Try cutting back on non-essentials and rebalance your next spending decision.";
    budgetStatusBadge.textContent = "Over budget";
    budgetStatusBadge.className = "pill status-danger";
    return;
  }

  if (state.goal > 0 && saved < state.goal) {
    const shortfall = state.goal - saved;
    budgetStatusTitle.textContent = "You have not reached your savings goal yet.";
    budgetStatusText.textContent = `You are ${formatCurrency(shortfall)} short of your goal. Slowing down on wants could help you get back on track.`;
    budgetStatusBadge.textContent = "Below goal";
    budgetStatusBadge.className = "pill status-warn";
    return;
  }

  if (remaining <= 100 && remaining > 0) {
    budgetStatusTitle.textContent = "You are getting close to your limit.";
    budgetStatusText.textContent = "You still have some safe money left, but you are near the edge. Try keeping the rest for a true need.";
    budgetStatusBadge.textContent = "Use caution";
    budgetStatusBadge.className = "pill status-warn";
    return;
  }

  budgetStatusTitle.textContent = "You went over your goal in a good way.";
  budgetStatusText.textContent = "Nice work. You covered your savings goal and still have safe money left to use carefully or keep for later.";
  budgetStatusBadge.textContent = "Ahead of goal";
  budgetStatusBadge.className = "pill status-good";
}

function renderBarChart() {
  if (!barChart) {
    return;
  }

  const totals = getCategoryTotals().slice(0, 5);
  if (!totals.length) {
    barChart.innerHTML = '<p class="empty-state">Your category chart will appear after you add some expenses.</p>';
    return;
  }

  const max = totals[0][1] || 1;
  barChart.innerHTML = totals
    .map(([category, total]) => {
      const width = Math.max(8, Math.round((total / max) * 100));
      return `
        <div class="bar-row">
          <div class="bar-row-head">
            <strong>${category}</strong>
            <span>${formatCurrency(total)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCategories() {
  if (!categoryList) {
    return;
  }

  const totals = getCategoryTotals();
  if (!totals.length) {
    categoryList.innerHTML = `
      <section class="empty-panel">
        <p class="empty-state">No spending categories yet. Add your first expense to see where your money goes.</p>
        <div class="starter-tags" aria-label="Suggested categories">
          <span class="starter-tag">Food</span>
          <span class="starter-tag">Transport</span>
          <span class="starter-tag">School</span>
          <span class="starter-tag">Bills</span>
        </div>
        <div class="empty-tip-card">
          <strong>Quick start</strong>
          <p>Most students begin by logging one meal, one ride, and one school cost so patterns show up faster.</p>
        </div>
      </section>
    `;
    return;
  }

  categoryList.innerHTML = totals
    .map(([category, total]) => `
      <article class="category-row">
        <strong>${category}</strong>
        <strong>${formatCurrency(total)}</strong>
      </article>
    `)
    .join("");
}

function renderExpenses() {
  if (!expenseList) {
    return;
  }

  if (!state.expenses.length) {
    expenseList.innerHTML = `
      <section class="empty-panel empty-panel-wide">
        <p class="empty-state">No expenses added yet. Try logging food, transport, books, or a social purchase.</p>
        <div class="starter-list" aria-label="Starter expense ideas">
          <article class="starter-item">
            <strong>Dining hall top-up</strong>
            <span>Food</span>
          </article>
          <article class="starter-item">
            <strong>Bus pass reload</strong>
            <span>Transport</span>
          </article>
          <article class="starter-item">
            <strong>Notebook + supplies</strong>
            <span>School</span>
          </article>
        </div>
      </section>
    `;
    return;
  }

  expenseList.innerHTML = [...state.expenses]
    .reverse()
    .map((expense) => `
      <article class="expense-row">
        <div class="expense-row-head">
          <strong>${expense.name}</strong>
          <strong>${formatCurrency(Number(expense.amount || 0))}</strong>
        </div>
        <div class="expense-meta">
          <span class="pill pill-soft">${expense.category}</span>
          <span class="pill ${expense.reason === "Need" || expense.reason === "Long-term value" ? "pill-need" : expense.reason === "Want" ? "pill-want" : "pill-caution"}">${expense.reason}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderDecision() {
  if (!decisionTitle || !decisionText || !decisionBadge) {
    return;
  }

  if (!state.expenses.length) {
    decisionTitle.textContent = "Ready to make a smarter choice?";
    decisionText.textContent = "Add a purchase and CampusMint will tell you whether it looks like a need, a want, or something worth pausing on before you spend.";
    decisionBadge.textContent = "Waiting for a purchase";
    decisionBadge.className = "pill";
    return;
  }

  const latestExpense = state.expenses[state.expenses.length - 1];
  const decision = getDecision(latestExpense);

  decisionTitle.textContent = decision.title;
  decisionText.textContent = decision.text;
  decisionBadge.textContent = decision.badge;
  decisionBadge.className = decision.badgeClass;
}

function renderApp() {
  renderSummary();
  renderChart();
  renderBudgetStatus();
  renderBarChart();
  renderCategories();
  renderExpenses();
  renderDecision();
}

if (yearLabel) {
  yearLabel.textContent = new Date().getFullYear().toString();
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (budgetForm) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.income = Number(incomeInput.value) || 0;
    state.goal = Number(goalInput.value) || 0;
    saveState();
    renderApp();
  });
}

if (expenseForm) {
  expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = expenseNameInput.value.trim();
    const amount = Number(expenseAmountInput.value);

    if (!name || amount <= 0) {
      return;
    }

    state.expenses.push({
      name,
      amount,
      category: expenseCategoryInput.value,
      reason: expenseReasonInput.value,
    });

    saveState();
    renderApp();
    expenseForm.reset();
    expenseCategoryInput.value = "Food";
    expenseReasonInput.value = "Need";
  });
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    state = { ...defaultState };
    saveState();
    renderApp();
    if (budgetForm) {
      budgetForm.reset();
    }
    if (expenseForm) {
      expenseForm.reset();
    }
  });
}

renderApp();
