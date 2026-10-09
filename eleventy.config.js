// Eleventy build settings for defytheoddscc.com
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers", "src/_redirects": "_redirects" });

  eleventyConfig.addGlobalData("year", () => new Date().getFullYear());

  // "September 30, 2026"
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  // *word* -> <em>word</em> (used for the italic accent in headlines)
  eleventyConfig.addFilter("emphasis", (s) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*([^*]+)\*/g, "<em>$1</em>")
  );
  const services = {
    "social-media-management": "Social Media Management",
    "content-creation": "Content Creation",
    "video-production": "Video Production",
    "marketing-campaigns": "Marketing Campaigns",
  };
  eleventyConfig.addFilter("serviceName", (s) => services[s] || "Our Services");

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/*.md").filter((p) => !p.data.draft).sort((a, b) => a.date - b.date || b.page.fileSlug.localeCompare(a.page.fileSlug))
  );

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    // Page bodies are plain HTML; don't run them through a template language
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
  };
}
