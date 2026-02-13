const OrganizationStructuredData = () => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://nectar-perfumes.com';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nectar",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "Discover luxury fragrances that tell stories, evoke emotions, and leave an unforgettable impression. Nectar offers a curated collection of exquisite perfumes.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "hello@nectar.com",
      "telephone": "+1-555-123-4567",
    },
    "sameAs": [
      // Add social media links if available
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default OrganizationStructuredData;

