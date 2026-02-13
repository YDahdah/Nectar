import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Checkout from "../Checkout";

const renderCheckout = () =>
  render(
    <BrowserRouter>
      <CartProvider>
        <Checkout />
      </CartProvider>
    </BrowserRouter>
  );

describe("Checkout", () => {
  it("renders step indicator with Delivery, Payment, and Review", () => {
    renderCheckout();
    const nav = screen.getByRole("navigation", { name: /checkout steps/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByText(/Delivery/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Payment/i)).toBeInTheDocument();
    expect(within(nav).getByText(/Review/i)).toBeInTheDocument();
  });

  it("shows Delivery step content by default", () => {
    renderCheckout();
    expect(screen.getByRole("heading", { name: /Delivery/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next: Payment/i })).toBeInTheDocument();
  });

  it("does not advance to step 2 when Next is clicked with invalid delivery data", () => {
    renderCheckout();
    const nextButton = screen.getByRole("button", { name: /Next: Payment/i });
    fireEvent.click(nextButton);
    // Still on step 1: Delivery heading and required field errors
    expect(screen.getByRole("heading", { name: /Delivery/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it("Complete order button is not visible until step 3", () => {
    renderCheckout();
    expect(screen.queryByRole("button", { name: /Complete order/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next: Payment/i })).toBeInTheDocument();
  });
});
