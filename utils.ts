
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatCurrencyInputDisplay = (value: number): string => {
  if (!value) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const parseCurrencyInput = (value: string): number => {
  // Remove everything except digits
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return 0;
  return parseInt(clean) / 100;
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${date.getMonth()}`;
};
