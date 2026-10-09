// Settings shared by every blog post in this folder.
export default {
  layout: "post.njk",
  tags: ["posts"],
  og_type: "article",
  permalink: (data) => (data.draft ? false : `blog-${data.page.fileSlug}.html`),
  eleventyComputed: {
    share_image: (data) => data.card_image || data.hero_image,
    preload: (data) => data.hero_image || data.card_image,
    schema: (data) => {
      const url = `${data.site.url}/blog-${data.page.fileSlug}`;
      const day = new Date(data.page.date).toISOString().slice(0, 10);
      const img = data.site.url + (data.card_image || data.hero_image || data.site.social_image);
      return [
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: data.title,
          description: data.seo_description || data.description,
          datePublished: day,
          dateModified: day,
          mainEntityOfPage: url,
          image: img,
          author: { "@type": "Person", name: data.author || "Jesse Walker Jr.", url: `${data.site.url}/about` },
          publisher: { "@type": "Organization", name: data.site.name, logo: { "@type": "ImageObject", url: `${data.site.url}/assets/defy-the-odds-creative-co-logo.png` } },
        }),
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${data.site.url}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${data.site.url}/blog` },
            { "@type": "ListItem", position: 3, name: data.title, item: url },
          ],
        }),
      ];
    },
  },
};
