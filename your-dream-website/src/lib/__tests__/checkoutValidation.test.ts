import { describe, it, expect } from "vitest";
import { validateDeliveryFields, type CheckoutFormData } from "../checkoutValidation";

const validData: CheckoutFormData = {
  firstName: "John",
  lastName: "Doe",
  address: "123 Main St",
  city: "Beirut",
  caza: "Beirut",
  phone: "03123456",
  email: "john@testdomain.com",
};

describe("validateDeliveryFields", () => {
  it("returns no errors for valid data", () => {
    expect(validateDeliveryFields(validData)).toEqual({});
  });

  it("requires first name", () => {
    expect(validateDeliveryFields({ ...validData, firstName: "" })).toMatchObject({
      firstName: "First name is required",
    });
    expect(validateDeliveryFields({ ...validData, firstName: "   " })).toMatchObject({
      firstName: "First name is required",
    });
  });

  it("requires last name", () => {
    expect(validateDeliveryFields({ ...validData, lastName: "" })).toMatchObject({
      lastName: "Last name is required",
    });
  });

  it("requires address", () => {
    expect(validateDeliveryFields({ ...validData, address: "" })).toMatchObject({
      address: "Address is required",
    });
  });

  it("requires city", () => {
    expect(validateDeliveryFields({ ...validData, city: "" })).toMatchObject({
      city: "City is required",
    });
  });

  it("requires caza", () => {
    expect(validateDeliveryFields({ ...validData, caza: "" })).toMatchObject({
      caza: "Caza is required",
    });
  });

  it("requires phone and validates 8 digits for Lebanon", () => {
    expect(validateDeliveryFields({ ...validData, phone: "" })).toMatchObject({
      phone: "Phone number is required",
    });
    expect(validateDeliveryFields({ ...validData, phone: "123" })).toMatchObject({
      phone: "Lebanese phone number must be exactly 8 digits",
    });
    expect(validateDeliveryFields({ ...validData, phone: "0312345" })).toMatchObject({
      phone: "Lebanese phone number must be exactly 8 digits",
    });
    expect(validateDeliveryFields({ ...validData, phone: "031234567" })).toMatchObject({
      phone: "Lebanese phone number must be exactly 8 digits",
    });
    expect(validateDeliveryFields({ ...validData, phone: "03 123 456" })).toEqual({});
    expect(validateDeliveryFields({ ...validData, phone: "76123456" })).toEqual({});
  });

  it("email is optional but validates format when provided", () => {
    // Empty email should be allowed
    expect(validateDeliveryFields({ ...validData, email: "" })).toEqual({});
    expect(validateDeliveryFields({ ...validData, email: "   " })).toEqual({});
    
    // Invalid format should show error
    expect(validateDeliveryFields({ ...validData, email: "invalid" })).toMatchObject({
      email: "Please enter a valid email address",
    });
    
    // Valid email should pass
    expect(validateDeliveryFields({ ...validData, email: "a@b.c" })).toEqual({});
  });

  it("returns multiple errors when multiple fields invalid", () => {
    const result = validateDeliveryFields({
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      caza: "",
      phone: "",
      email: "",
    });
    // Email is optional, so empty email should not produce an error
    expect(Object.keys(result).length).toBe(6);
    expect(result.firstName).toBeDefined();
    expect(result.email).toBeUndefined();
  });
});
