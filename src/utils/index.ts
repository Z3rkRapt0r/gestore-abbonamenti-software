export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Rimuove caratteri speciali
    .replace(/[\s_-]+/g, '-') // Sostituisce spazi e underscore con trattini
    .replace(/^-+|-+$/g, ''); // Rimuove trattini all'inizio e alla fine
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getSubscriptionStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-green-600 bg-green-100';
    case 'PAST_DUE':
      return 'text-yellow-600 bg-yellow-100';
    case 'CANCELED':
      return 'text-red-600 bg-red-100';
    case 'PAUSED':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getSubscriptionStatusText(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Attivo';
    case 'PAST_DUE':
      return 'In Ritardo';
    case 'CANCELED':
      return 'Cancellato';
    case 'PAUSED':
      return 'In Pausa';
    default:
      return 'Sconosciuto';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

