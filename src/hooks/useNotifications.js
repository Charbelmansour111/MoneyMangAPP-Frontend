import { useMemo } from 'react';

export function useNotifications(budgets, transactions, savings) {
  const notifications = useMemo(() => {
    const result = [];
    const now = new Date();

    // ── BUDGET NOTIFICATIONS ─────────────────────────────────────────────
    budgets.forEach(budget => {
      const categoryID = String(budget.categoryID);

      // calculate period start
      let start;
      if (budget.period === 'weekly') {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - start.getDay());
      } else if (budget.period === 'yearly') {
        start = new Date(now.getFullYear(), 0, 1);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const spent = transactions
        .filter(t =>
          t.categoryID != null &&
          String(t.categoryID) === categoryID &&
          new Date(t.date) >= start &&
          t.status === 'expense'
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const catName = budget.categoryName || `Budget #${budget.budgetID}`;
      const remaining = Math.max(0, budget.amount - spent).toFixed(2);

      if (pct >= 100) {
        result.push({
          id: `budget-${budget.budgetID}-100`,
          type: 'danger',
          icon: '🚨',
          title: `Over budget on ${catName}`,
          message: `You've exceeded your ${budget.period} limit by $${(spent - budget.amount).toFixed(2)}.`,
          action: 'View Budget Alerts',
          actionPath: '/budget',
          time: 'Now',
        });
      } else if (pct >= 95) {
        result.push({
          id: `budget-${budget.budgetID}-95`,
          type: 'danger',
          icon: '🔴',
          title: `Almost at limit — ${catName}`,
          message: `You've used ${Math.round(pct)}% of your ${budget.period} budget. Only $${remaining} left.`,
          action: 'View Budget Alerts',
          actionPath: '/budget',
          time: 'Now',
        });
      } else if (pct >= 80) {
        result.push({
          id: `budget-${budget.budgetID}-80`,
          type: 'warning',
          icon: '⚠️',
          title: `Getting close — ${catName}`,
          message: `You've used ${Math.round(pct)}% of your ${budget.period} budget. $${remaining} remaining.`,
          action: 'View Budget Alerts',
          actionPath: '/budget',
          time: 'Now',
        });
      } else if (pct >= 50) {
        result.push({
          id: `budget-${budget.budgetID}-50`,
          type: 'info',
          icon: '📊',
          title: `Halfway through — ${catName}`,
          message: `You've used ${Math.round(pct)}% of your ${budget.period} budget. $${remaining} remaining.`,
          action: 'View Budget Alerts',
          actionPath: '/budget',
          time: 'Now',
        });
      }
    });

    // ── SAVINGS NOTIFICATIONS ────────────────────────────────────────────
    savings.forEach(goal => {
      if (!goal.deadline || goal.status === 'completed') return;

      const deadline = new Date(goal.deadline);
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      const pct = goal.amountToSave > 0 ? (goal.paidAmountMonthly / goal.amountToSave) * 100 : 0;

      if (daysLeft < 0) {
        result.push({
          id: `savings-${goal.savingID}-overdue`,
          type: 'danger',
          icon: '❌',
          title: `Deadline passed — ${goal.name}`,
          message: `Your deadline was ${deadline.toLocaleDateString()}. You saved ${Math.round(pct)}% of your goal.`,
          action: 'View Savings',
          actionPath: '/savings',
          time: `${Math.abs(daysLeft)}d ago`,
        });
      } else if (daysLeft <= 7) {
        result.push({
          id: `savings-${goal.savingID}-7`,
          type: 'danger',
          icon: '🔴',
          title: `Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left — ${goal.name}`,
          message: `Deadline: ${deadline.toLocaleDateString()}. You've saved ${Math.round(pct)}% so far.`,
          action: 'Contribute Now',
          actionPath: '/savings',
          time: `${daysLeft}d left`,
        });
      } else if (daysLeft <= 14) {
        result.push({
          id: `savings-${goal.savingID}-14`,
          type: 'warning',
          icon: '⚠️',
          title: `2 weeks left — ${goal.name}`,
          message: `Deadline: ${deadline.toLocaleDateString()}. You've saved ${Math.round(pct)}% of your goal.`,
          action: 'Contribute Now',
          actionPath: '/savings',
          time: `${daysLeft}d left`,
        });
      } else if (daysLeft <= 30) {
        result.push({
          id: `savings-${goal.savingID}-30`,
          type: 'info',
          icon: '📅',
          title: `30 days left — ${goal.name}`,
          message: `Deadline: ${deadline.toLocaleDateString()}. You've saved ${Math.round(pct)}% of your goal.`,
          action: 'View Savings',
          actionPath: '/savings',
          time: `${daysLeft}d left`,
        });
      }
    });

    // sort: danger first, then warning, then info
    const order = { danger: 0, warning: 1, info: 2 };
    return result.sort((a, b) => order[a.type] - order[b.type]);
  }, [budgets, transactions, savings]);

  return notifications;
}