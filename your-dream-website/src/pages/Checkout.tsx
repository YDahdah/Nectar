import { useState, useEffect } from "react";
import { ShoppingBag, ChevronDown, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import MetaTags from "@/components/MetaTags";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, CLOUD_FUNCTION_URL, getImageUrl } from "@/lib/config";
import { validateDeliveryFields } from "@/lib/checkoutValidation";

const CHECKOUT_SAVED_KEY = "nectar_checkout_saved";

const STEPS = [
  { id: 1, label: "Delivery", short: "Delivery" },
  { id: 2, label: "Payment", short: "Payment" },
  { id: 3, label: "Review", short: "Review" },
] as const;

const Checkout = () => {
  const { getTotalPrice, items, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("express");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    country: "Lebanon",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    caza: "",
    phone: "",
    email: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_SAVED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        if (parsed && typeof parsed.firstName === "string") {
          setFormData((prev) => ({
            ...prev,
            firstName: parsed.firstName ?? prev.firstName,
            lastName: parsed.lastName ?? prev.lastName,
            address: parsed.address ?? prev.address,
            city: parsed.city ?? prev.city,
            caza: parsed.caza ?? prev.caza,
            phone: parsed.phone ?? prev.phone,
            email: parsed.email ?? prev.email,
          }));
        }
      }
    } catch {
      /* ignore invalid stored data */
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateDelivery = (): boolean => {
    const errors = validateDeliveryFields(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    if (!validateDelivery()) return false;
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (step === 1 && validateDelivery()) setStep(2);
    else if (step === 2) setStep(3);
  };

  const goToPrevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingCost = formData.caza === "North Lebanon" ? 3.0 : 5.0;
      const totalPrice = getTotalPrice() + shippingCost;

      const orderData = {
        ...formData,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.image,
        })),
        shippingCost,
        totalPrice,
        paymentMethod,
        shippingMethod: "Delivery (2-3 Working Days)",
      };


      const orderEndpoint = CLOUD_FUNCTION_URL
        ? CLOUD_FUNCTION_URL
        : `${API_BASE}/api/orders/checkout`;

      let response: Response;
      try {
        response = await fetch(orderEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });
      } catch (networkError) {
        const errorMsg = CLOUD_FUNCTION_URL
          ? "Cannot connect to the order service. Please check your internet connection."
          : "Cannot connect to the checkout server. Start the backend with: cd server && npm start";
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      let result: { orderId?: string; error?: string; success?: boolean; message?: string } = {};
      if (isJson) {
        try {
          result = await response.json();
        } catch {
          throw new Error("Invalid response from server. Please try again.");
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Checkout endpoint not found. If using local dev, start the backend (cd server && npm start) and set VITE_PROXY_TARGET=http://localhost:3000 in .env."
          );
        }
        const msg = result?.error || result?.message || (response.status === 502 ? "Backend unavailable. Is the server running?" : "Failed to place order");
        throw new Error(msg);
      }

      // Handle Cloud Function response format
      if (!result.orderId && result.success) {
        // Cloud Function returns success but might not have orderId in response
        // Generate a temporary one for display
        result.orderId = `ORD-${Date.now()}`;
      }

      toast({
        title: "Order placed successfully!",
        description: `Your order #${result.orderId} has been received.`,
      });

      clearCart();

      // Redirect to order confirmation page
      setTimeout(() => {
        navigate(`/order-confirmation?orderId=${result.orderId}`);
      }, 1500);
    } catch (error) {
      console.error("Checkout error:", error);

      let errorMessage = "Failed to place order. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingCost = formData.caza === "North Lebanon" ? 3.0 : 5.0;
  const totalWithShipping = getTotalPrice() + shippingCost;

  return (
    <div className="min-h-screen bg-white">
      <MetaTags
        title="Checkout - Nectar"
        description="Complete your order. Secure checkout with cash on delivery available."
      />
      <SkipLink />
      {/* Header */}
      <div className="border-b border-border" role="banner">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Custom Checkout Logo */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                {/* NECTAR - bold sans-serif, dark grey */}
                <span
                  className="text-xl font-bold uppercase"
                  style={{
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    lineHeight: "1.2",
                    fontWeight: 700,
                    color: "#363636"
                  }}
                >
                  NECTAR
                </span>

                {/* perfume - cursive, golden, centered under NECTAR */}
                <span
                  className="text-base lowercase"
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    lineHeight: "1.2",
                    color: "#CE9B3A"
                  }}
                >
                  perfume
                </span>
              </div>
              {/* Stylized N logo icon */}
              <span className="flex flex-shrink-0 items-center justify-center rounded-sm p-1 bg-background">
                <img
                  src="/nectar-checkout-logo.png"
                  alt="Nectar Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  aria-hidden
                />
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ShoppingBag className="w-5 h-5 text-foreground shrink-0" aria-hidden />
              <span className="text-sm sm:text-base font-normal text-foreground">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="pt-6 sm:pt-8 pb-24" role="main">
        <form onSubmit={handleSubmit} className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl" aria-label="Checkout form">
          {/* Step indicator */}
          <nav aria-label="Checkout steps" className="mb-8">
            <ol className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-2 text-sm ${step >= s.id ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${step > s.id ? "border-accent bg-accent text-accent-foreground" : step === s.id ? "border-accent bg-background" : "border-border"
                      }`}
                    aria-current={step === s.id ? "step" : undefined}
                  >
                    {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                  {i < STEPS.length - 1 && (
                    <span className="ml-1 hidden flex-1 max-w-[40px] border-t border-border sm:inline-block" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-8">
            {/* Order Summary (Collapsible on step 1–2, expanded on step 3) */}
            <div className="bg-card rounded-md p-6 border border-border">
              <button
                type="button"
                onClick={() => step !== 3 && setOrderSummaryOpen(!orderSummaryOpen)}
                className="w-full flex items-center justify-between mb-4 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={orderSummaryOpen || step === 3}
                aria-controls="order-summary-content"
                disabled={step === 3}
              >
                <h2 className="text-base font-normal text-card-foreground">Order summary</h2>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-card-foreground">
                    ${totalWithShipping.toFixed(2)}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-card-foreground transition-transform ${orderSummaryOpen ? "rotate-180" : ""
                      }`}
                    aria-hidden
                  />
                </div>
              </button>

              <div id="order-summary-content" role="region" aria-label="Order summary details">
                {(orderSummaryOpen || step === 3) && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    {/* Product Details */}
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex items-start gap-4">
                        <div className="relative w-16 h-16 bg-background rounded-md overflow-hidden flex-shrink-0 border border-border">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain p-2"
                            fetchpriority="low"
                          />
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-normal text-card-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{item.size}</p>
                          </div>
                          <span className="text-sm font-normal text-card-foreground">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Cost Breakdown */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-card-foreground">${getTotalPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-card-foreground">${shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-base font-bold text-card-foreground">Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">USD</span>
                          <span className="text-lg font-bold text-card-foreground">
                            ${totalWithShipping.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 1: Delivery */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-base font-normal text-card-foreground">Delivery</h2>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm text-card-foreground">
                    Country/Region
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                  >
                    <SelectTrigger
                      id="country"
                      className="w-full h-12 rounded-md border-gray-300 bg-white"
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lebanon">Lebanon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm text-card-foreground">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.firstName ? "border-red-500" : ""
                        }`}
                      aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
                      aria-invalid={!!formErrors.firstName}
                    />
                    {formErrors.firstName && (
                      <p id="firstName-error" className="text-sm text-red-500" role="alert">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm text-card-foreground">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.lastName ? "border-red-500" : ""
                        }`}
                      aria-describedby={formErrors.lastName ? "lastName-error" : undefined}
                      aria-invalid={!!formErrors.lastName}
                    />
                    {formErrors.lastName && (
                      <p id="lastName-error" className="text-sm text-red-500" role="alert">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm text-card-foreground">
                    Address
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.address ? "border-red-500" : ""
                      }`}
                    aria-describedby={formErrors.address ? "address-error" : undefined}
                    aria-invalid={!!formErrors.address}
                  />
                  {formErrors.address && (
                    <p id="address-error" className="text-sm text-red-500" role="alert">
                      {formErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm text-card-foreground">
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.city ? "border-red-500" : ""
                        }`}
                    />
                    {formErrors.city && (
                      <p id="city-error" className="text-sm text-red-500" role="alert">
                        {formErrors.city}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caza" className="text-sm text-card-foreground">
                      Caza
                    </Label>
                    <Select
                      value={formData.caza}
                      onValueChange={(value) => handleInputChange("caza", value)}
                    >
                      <SelectTrigger
                        id="caza"
                        className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.caza ? "border-red-500" : ""
                          }`}
                        aria-describedby={formErrors.caza ? "caza-error" : undefined}
                        aria-invalid={!!formErrors.caza}
                      >
                        <SelectValue placeholder="Select caza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beirut">Beirut</SelectItem>
                        <SelectItem value="Mount Lebanon">Mount Lebanon</SelectItem>
                        <SelectItem value="North Lebanon">North Lebanon</SelectItem>
                        <SelectItem value="South Lebanon">South Lebanon</SelectItem>
                        <SelectItem value="Bekaa">Bekaa</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.caza && (
                      <p id="caza-error" className="text-sm text-red-500" role="alert">
                        {formErrors.caza}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-card-foreground">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="03 123 456 (8 digits)"
                    value={formData.phone}
                    onChange={(e) => {
                      // Allow only digits and spaces
                      const value = e.target.value.replace(/[^\d\s]/g, '');
                      handleInputChange("phone", value);
                    }}
                    maxLength={15}
                    className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.phone ? "border-red-500" : ""
                      }`}
                    aria-describedby={formErrors.phone ? "phone-error" : undefined}
                  />
                  {formErrors.phone && (
                    <p id="phone-error" className="text-sm text-red-500" role="alert">
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-card-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full h-12 rounded-md border-gray-300 bg-white ${formErrors.email ? "border-red-500" : ""
                      }`}
                    aria-describedby={formErrors.email ? "email-error" : undefined}
                    aria-invalid={!!formErrors.email}
                  />
                  {formErrors.email && (
                    <p id="email-error" className="text-sm text-red-500" role="alert">
                      {formErrors.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-base font-normal text-card-foreground">Shipping method</h2>
                <div className="border border-border rounded-md p-4 flex items-center justify-between bg-card">
                  <span className="text-sm text-card-foreground">Delivery (2-3 Working Days)</span>
                  <span className="text-sm font-normal text-card-foreground">${shippingCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-normal text-card-foreground">Payment</h2>
                <p className="text-sm text-muted-foreground">All transactions are secure and encrypted.</p>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="border border-border rounded-md bg-card">
                    <label className="flex items-center p-4 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" className="mr-3" />
                      <span className="text-sm text-card-foreground">Cash on Delivery (COD)</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-normal text-card-foreground">Review your order</h2>
                <div className="bg-muted/30 rounded-md p-4 space-y-2 text-xs sm:text-sm break-words">
                  <p><span className="text-muted-foreground">Delivery:</span> {formData.firstName} {formData.lastName}, {formData.address}, {formData.city}, {formData.caza}. {formData.phone} · {formData.email}</p>
                  <p><span className="text-muted-foreground">Shipping:</span> Delivery (2-3 Working Days) — ${shippingCost.toFixed(2)}</p>
                  <p><span className="text-muted-foreground">Payment:</span> Cash on Delivery (COD)</p>
                </div>
              </div>
            )}

            {/* Step navigation & Submit */}
            <div className="pt-8 flex flex-col sm:flex-row gap-3">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                  className="flex-1 h-12 border-gray-300 rounded-md"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : null}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 h-12 bg-black text-white hover:bg-gray-900 rounded-md"
                >
                  Next: {STEPS[step].label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-black text-white hover:bg-gray-900 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing order...
                    </>
                  ) : (
                    "Complete order"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;

