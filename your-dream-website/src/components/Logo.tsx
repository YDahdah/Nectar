import { Link, useLocation } from "react-router-dom";
import nectarLogoIcon from "@/assets/nectar-logo-icon.png";

/** Homepage-only logo icon (gold N + stopper) – served from public. */
const HOMEPAGE_LOGO_SRC = "/nectar-home-logo.png";

interface LogoProps {
  className?: string;
  showLink?: boolean;
  variant?: "default" | "footer" | "hero";
}

const Logo = ({ className = "", showLink = true, variant = "default" }: LogoProps) => {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  const iconSize = variant === "footer" ? 32 : 40;
  const textSize = variant === "footer" ? "text-base" : "text-xl";
  const perfumeSize = variant === "footer" ? "text-sm" : "text-base";
  const iconBgClass = variant === "footer" ? "bg-primary" : variant === "hero" ? "bg-white" : "bg-background";

  /** Use the custom N + stopper logo only on the homepage (header and hero). */
  const iconSrc = isHomePage || variant === "hero" ? HOMEPAGE_LOGO_SRC : nectarLogoIcon;

  const logoContent = (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      <div className="flex flex-col items-center">
        {/* NECTAR - bold sans-serif, dark grey */}
        <span 
          className={`font-bold uppercase ${textSize}`}
          style={{ 
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            lineHeight: "1.2",
            fontWeight: 700,
            color: "#363636"
          }}
        >
          NECTAR
        </span>
        
        {/* perfume - cursive, golden, centered under NECTAR, a bit larger */}
        <span
          className={`lowercase ${perfumeSize}`}
          style={{
            fontFamily: "'Dancing Script', cursive",
            lineHeight: "1.2",
            color: "#CE9B3A"
          }}
        >
          perfume
        </span>
      </div>
      {/* Stylized N / bottle icon – custom image on homepage only */}
      <span className={`flex flex-shrink-0 items-center justify-center rounded-sm p-1 ${iconBgClass}`}>
        <img
          src={iconSrc}
          alt=""
          width={iconSize}
          height={iconSize}
          className="object-contain"
          aria-hidden
        />
      </span>
    </div>
  );

  if (showLink) {
    return (
      <Link 
        to="/" 
        className="flex items-center no-underline hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
        style={{ textDecoration: "none", color: "inherit" }}
        aria-label="Nectar Perfume - Home"
      >
        {logoContent}
      </Link>
    );
  }

  return <div className="flex items-center" style={{ color: "inherit" }}>{logoContent}</div>;
};

export default Logo;

