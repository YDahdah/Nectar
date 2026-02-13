import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SkipLink from "../SkipLink";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("SkipLink", () => {
  it("renders a link with 'Skip to main content' text", () => {
    renderWithRouter(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
  });

  it("links to main content target", () => {
    renderWithRouter(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link.getAttribute("href")).toContain("main-content");
  });

  it("is focusable and has sr-only class for accessibility", () => {
    renderWithRouter(<SkipLink />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveClass("sr-only");
  });
});
