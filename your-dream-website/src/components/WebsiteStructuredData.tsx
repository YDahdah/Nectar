const WebsiteStructuredData = () => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://nectar-perfumes.com';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Nectar - Luxury Fragrances",
    "url": baseUrl,
    "description": "Discover luxury fragrances that tell stories, evoke emotions, and leave an unforgettable impression. Shop premium perfumes for men and women.",
    "publisher": {
      "@type": "Organization",
      "name": "Nectar",
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default WebsiteStructuredData;

