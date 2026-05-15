import { useEffect } from 'react';

const SEO = ({ title, description, keywords, canonical }) => {
  useEffect(() => {
    // Updtate Title
    if (title) {
      document.title = `${title} | paperFlow`;
    }

    // Update Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords) {
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical && canonical) {
      linkCanonical.setAttribute('href', canonical);
    } else if (canonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      linkCanonical.setAttribute('href', canonical);
      document.head.appendChild(linkCanonical);
    }

    // Update Open Graph and Twitter Tags
    const updateMetaTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`) || 
                document.querySelector(`meta[name="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      }
    };

    if (title) {
      updateMetaTag('og:title', title);
      updateMetaTag('twitter:title', title);
    }
    if (description) {
      updateMetaTag('og:description', description);
      updateMetaTag('twitter:description', description);
    }

  }, [title, description, keywords, canonical]);

  return null;
};

export default SEO;
