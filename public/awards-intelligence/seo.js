window.AwardsSeo = (() => {
  function setMetadata({ title, description, url, image, type = "website", jsonLd }) {
    if (title) document.title = title;
    const pageUrl = url || window.location.href;
    const copy = description || "The Screening Room tracks films worth following.";
    setMeta("description", copy);
    setMeta("og:title", title || document.title, "property");
    setMeta("og:description", copy, "property");
    setMeta("og:type", type, "property");
    setMeta("og:url", pageUrl, "property");
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title || document.title);
    setMeta("twitter:description", copy);
    if (image) {
      setMeta("og:image", image, "property");
      setMeta("twitter:image", image);
    }
    setCanonical(pageUrl);
    setJsonLd(jsonLd);
  }

  function setMeta(name, content, attribute = "name") {
    if (!content) return;
    let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  }

  function setCanonical(url) {
    let element = document.head.querySelector('link[rel="canonical"]');
    if (!element) {
      element = document.createElement("link");
      element.setAttribute("rel", "canonical");
      document.head.appendChild(element);
    }
    element.setAttribute("href", url);
  }

  function setJsonLd(data) {
    document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((element) => element.remove());
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoJsonld = "true";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  return { setMetadata };
})();
