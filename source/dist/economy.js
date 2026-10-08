export const ACCOUNT_LABELS = {
  video: 'Video advertising',
  settlements: 'City awards',
  wages: 'Service wages',
  priorIncome: 'Income before detailed tracking',
  otherIncome: 'Other income',
  gear: 'Equipment & wardrobe',
  production: 'Editing, data & crew',
  medical: 'Hospital bills',
  repairs: 'Equipment repairs',
  home: 'Home security, cleanup & damage',
  fallout: 'Friends & family fallout',
  hoa: 'HOA fines',
  interest: 'Interest',
  loanFees: 'Loan fees',
  filing: 'Claim filing',
  legal: 'Settlement lawyer fees',
  transport: 'Fuel & travel',
  living: 'Daily overhead',
  priorExpenses: 'Expenses before detailed tracking',
  otherExpense: 'Other costs',
};
export const INCOME_ACCOUNTS = ['video', 'settlements', 'wages', 'priorIncome', 'otherIncome'];
export function accountCategory(amount, label) {
  if (amount > 0)
    return /^Ad revenue:/.test(label)
      ? 'video'
      : /^City settlement|^Civil settlement/.test(label)
        ? 'settlements'
        : /^Honest wages:/.test(label)
          ? 'wages'
          : 'otherIncome';
  if (/^HOA:/.test(label)) return 'hoa';
  if (/^Fallout:/.test(label)) return 'fallout';
  if (/interest:/i.test(label)) return 'interest';
  if (/^New loan fee/.test(label)) return 'loanFees';
  if (/^Civil claim filing/.test(label)) return 'filing';
  if (/^Settlement lawyer|^Legal fees/.test(label)) return 'legal';
  if (/^Hospital:/.test(label)) return 'medical';
  if (/^Repair:/.test(label)) return 'repairs';
  if (/^Editing,/.test(label)) return 'production';
  if (/^Home |^Security floodlight|^Lawn cleanup|^Gear: Doggie bags/.test(label)) return 'home';
  if (/^Gear:/.test(label)) return 'gear';
  if (/fuel|bus fare/i.test(label)) return 'transport';
  if (/^Daily /.test(label)) return 'living';
  return 'otherExpense';
}
export function validAccounts(accounts) {
  return (
    accounts &&
    typeof accounts === 'object' &&
    !Array.isArray(accounts) &&
    Object.entries(accounts).every(
      ([key, value]) =>
        Object.hasOwn(ACCOUNT_LABELS, key) && Number.isFinite(value) && value >= 0 && value <= 1e10,
    )
  );
}
