import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package, Mail, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import MetaTags from "@/components/MetaTags";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // If no order ID, redirect to home after a short delay
    if (!orderId) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white">
        <SkipLink />
        <Header />
        <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-12 py-24 sm:py-32 text-center pt-20" role="main">
          <h1 className="font-serif text-3xl mb-4">Order not found</h1>
          <p className="text-gray-600 mb-8">Redirecting you to the homepage...</p>
          <Link to="/" className="text-accent underline">
            Return to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <MetaTags
        title={`Order Confirmation #${orderId} - Nectar`}
        description={`Your order #${orderId} has been confirmed. Thank you for your purchase!`}
      />
      <SkipLink />
      {/* Header */}
      <div className="border-b border-gray-200" role="banner">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Logo />
          </div>
        </div>
      </div>

      <main id="main-content" className="pt-8 sm:pt-12 pb-24" role="main">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-4 text-[#363636]">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Thank you for your purchase
            </p>
            <p className="text-[#363636] font-medium">
              Order #<span className="font-bold">{orderId}</span>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-[#f5f5f0] rounded-md p-6 mb-8">
            <h2 className="text-base font-normal text-[#363636] mb-4">
              What happens next?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#363636]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#363636] mb-1">
                    Confirmation Email
                  </h3>
                  <p className="text-sm text-gray-600">
                    You'll receive an order confirmation email shortly with all the details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#363636]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#363636] mb-1">
                    Processing & Shipping
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your order will be processed and shipped within 2-3 working days via Express Delivery.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#363636]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#363636] mb-1">
                    We'll Contact You
                  </h3>
                  <p className="text-sm text-gray-600">
                    Our team will contact you to confirm delivery details and arrange payment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              className="flex-1 h-12 bg-black text-white hover:bg-gray-900 rounded-md"
            >
              <Link to="/shop">Continue Shopping</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 h-12 border-gray-300 rounded-md"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Need help with your order?
            </p>
            <p className="text-sm text-[#363636]">
              Contact us at{" "}
              <a href="mailto:lbnectar@gmail.com" className="text-accent hover:underline">
                lbnectar@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
