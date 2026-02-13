/**
 * Format phone number for WhatsApp (ensure it starts with +)
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return null;
  }

  let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
  
  // Remove any non-digit characters except +
  if (!formattedPhone.startsWith('+')) {
    // If it starts with 961, add +
    if (formattedPhone.startsWith('961')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.startsWith('0')) {
      // Remove leading 0 and add +961 for Lebanon
      formattedPhone = '+961' + formattedPhone.substring(1).replace(/\D/g, '');
    } else {
      // Assume it's a Lebanon number without country code
      const digitsOnly = formattedPhone.replace(/\D/g, '');
      formattedPhone = '+961' + digitsOnly;
    }
  } else {
    // Already has +, just clean it
    formattedPhone = '+' + formattedPhone.substring(1).replace(/\D/g, '');
  }

  return formattedPhone;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) {
    return false;
  }

  // Basic validation: should start with + and have at least 10 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phoneNumber);
}
