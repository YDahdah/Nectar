import { Link } from "react-router-dom";

const SkipLink = () => {
  return (
    <Link
      to="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
    >
      Skip to main content
    </Link>
  );
};

export default SkipLink;

