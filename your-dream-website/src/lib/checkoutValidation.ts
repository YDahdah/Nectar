/**
 * Pure validation for checkout delivery fields. Used by Checkout and tests.
 */
export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  caza: string;
  phone: string;
  email: string;
}

export function validateDeliveryFields(
  data: CheckoutFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!data.address.trim()) {
    errors.address = "Address is required";
  }
  if (!data.city.trim()) {
    errors.city = "City is required";
  }
  if (!data.caza) {
    errors.caza = "Caza is required";
  }
  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  } else {
    const digitsOnly = data.phone.replace(/\D/g, "");
    if (digitsOnly.length !== 8) {
      errors.phone = "Lebanese phone number must be exactly 8 digits";
    } else if (!/^[0-9]{8}$/.test(digitsOnly)) {
      errors.phone = "Please enter a valid phone number";
    }
  }
  if (!data.email.trim()) {
    errors.email = "Email is required for order confirmation";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  } else {
    // Warn about placeholder/test domains
    const emailDomain = data.email.trim().toLowerCase().split('@')[1];
    const invalidDomains = ['example.com', 'test.com', 'example.org', 'test.org', 'example.net'];
    if (invalidDomains.includes(emailDomain)) {
      errors.email = "Please use a real email address. Test domains don't receive email.";
    }
  }

  return errors;
}
