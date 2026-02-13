import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 sm:py-12 md:py-16 safe-area-bottom">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 md:mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-3 sm:mb-4">
              <Logo showLink={false} variant="footer" />
            </div>
            <p className="text-primary-foreground/70 text-xs sm:text-sm leading-relaxed">
              Curated collection of exquisite perfumes that capture moments and leave lasting impressions.
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-medium text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Contact
            </h4>
            <ul className="space-y-2 sm:space-y-3 text-primary-foreground/70 text-xs sm:text-sm">
              <li>
                <a 
                  href="mailto:lbnectar@gmail.com" 
                  className="flex items-center gap-2 hover:text-primary-foreground transition-colors touch-manipulation"
                >
                  <Mail className="w-4 h-4" />
                  lbnectar@gmail.com
                </a>
              </li>
              <li>
                <a 
                  href="tel:+96179195270" 
                  className="flex items-center gap-2 hover:text-primary-foreground transition-colors touch-manipulation"
                >
                  <Phone className="w-4 h-4" />
                  +961 79195270
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/60 text-xs sm:text-sm">
            © 2026 NECTAR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
