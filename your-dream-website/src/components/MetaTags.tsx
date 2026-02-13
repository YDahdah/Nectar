import { useEffect } from "react";

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const MetaTags = ({ 
  title = "Nectar - Luxury Fragrances",
  description = "Discover luxury fragrances that tell stories, evoke emotions, and leave an unforgettable impression.",
  image = "/favicon.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website"
}: MetaTagsProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = "name") => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("og:title", title, "property");
    updateMetaTag("og:description", description, "property");
    updateMetaTag("og:image", image, "property");
    updateMetaTag("og:url", url, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);
  }, [title, description, image, url, type]);

  return null;
};

export default MetaTags;
