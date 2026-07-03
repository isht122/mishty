export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s+\-()]{10,15}$/.test(phone.trim());
}

export function validatePincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
