import * as cheerio from 'cheerio';

export interface TechDetectionResult {
  technologies: string[];
  cms: string | null;
}

export function detectTechnologies(html: string): TechDetectionResult {
  const $ = cheerio.load(html);
  const technologies = new Set<string>();
  let cms: string | null = null;

  // Extract meta tags, script sources, and link sources
  const metaGenerator = $('meta[name="generator"]').attr('content') || '';
  const scripts: string[] = [];
  const links: string[] = [];
  const scriptContents: string[] = [];

  $('script').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      scripts.push(src.toLowerCase());
    } else {
      const text = $(el).text();
      if (text) {
        scriptContents.push(text);
      }
    }
  });

  $('link').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      links.push(href.toLowerCase());
    }
  });

  const fullHtmlLower = html.toLowerCase();

  // 1. WordPress Detection
  if (
    metaGenerator.toLowerCase().includes('wordpress') ||
    links.some(l => l.includes('wp-content') || l.includes('wp-includes')) ||
    scripts.some(s => s.includes('wp-content') || s.includes('wp-includes'))
  ) {
    technologies.add('WordPress');
    cms = 'WordPress';
  }

  // 2. Shopify Detection
  if (
    metaGenerator.toLowerCase().includes('shopify') ||
    links.some(l => l.includes('cdn.shopify.com')) ||
    scripts.some(s => s.includes('cdn.shopify.com')) ||
    scriptContents.some(c => c.includes('Shopify.shop') || c.includes('Shopify.theme'))
  ) {
    technologies.add('Shopify');
    cms = 'Shopify';
  }

  // 3. Webflow Detection
  if (
    metaGenerator.toLowerCase().includes('webflow') ||
    $('[data-wf-page]').length > 0 ||
    $('[data-wf-site]').length > 0 ||
    fullHtmlLower.includes('uploads-ssl.webflow.com')
  ) {
    technologies.add('Webflow');
    cms = 'Webflow';
  }

  // 4. Wix Detection
  if (
    metaGenerator.toLowerCase().includes('wix') ||
    links.some(l => l.includes('wixstatic.com')) ||
    scripts.some(s => s.includes('wixstatic.com')) ||
    fullHtmlLower.includes('wix-image') ||
    fullHtmlLower.includes('wix-dropdown')
  ) {
    technologies.add('Wix');
    cms = 'Wix';
  }

  // 5. Squarespace Detection
  if (
    links.some(l => l.includes('squarespace.com') || l.includes('static1.squarespace.com')) ||
    scriptContents.some(c => c.includes('Static.SQUARESPACE_CONTEXT')) ||
    fullHtmlLower.includes('squarespace-id')
  ) {
    technologies.add('Squarespace');
    cms = 'Squarespace';
  }

  // 6. React Detection
  if (
    scripts.some(s => s.includes('react') || s.includes('react-dom')) ||
    $('[data-reactroot]').length > 0 ||
    scriptContents.some(c => c.includes('react.production') || c.includes('_reactListenSplit'))
  ) {
    technologies.add('React');
  }

  // 7. Next.js Detection
  if (
    $('#__next').length > 0 ||
    scripts.some(s => s.includes('/_next/')) ||
    scriptContents.some(c => c.includes('__NEXT_DATA__'))
  ) {
    technologies.add('Next.js');
    technologies.add('React'); // Next.js implicitly uses React
  }

  // 8. Google Analytics Detection
  if (
    scripts.some(s => s.includes('google-analytics.com/analytics.js') || s.includes('googletagmanager.com/gtag/js')) ||
    scriptContents.some(c => c.includes('gtag(') || c.includes('ga(') || c.includes('google_analytics'))
  ) {
    technologies.add('Google Analytics');
  }

  // 9. Google Tag Manager (GTM) Detection
  if (
    scripts.some(s => s.includes('googletagmanager.com/gtm.js')) ||
    scriptContents.some(c => c.includes('gtm.start') || c.includes('dataLayer'))
  ) {
    technologies.add('GTM');
  }

  // 10. Meta Pixel Detection
  if (
    scripts.some(s => s.includes('connect.facebook.net')) ||
    scriptContents.some(c => c.includes('fbq(') || c.includes('fbq.push') || c.includes('connect.facebook.net/en_US/fbevents.js'))
  ) {
    technologies.add('Meta Pixel');
  }

  // 11. Calendly Detection
  if (
    scripts.some(s => s.includes('calendly.com')) ||
    links.some(l => l.includes('calendly.com')) ||
    fullHtmlLower.includes('calendly.com/external/widget.js') ||
    fullHtmlLower.includes('calendly-inline-widget')
  ) {
    technologies.add('Calendly');
  }

  // 12. Intercom Detection
  if (
    scripts.some(s => s.includes('widget.intercom.io')) ||
    scriptContents.some(c => c.includes('window.Intercom') || c.includes('intercomSettings'))
  ) {
    technologies.add('Intercom');
  }

  // 13. HubSpot Detection
  if (
    scripts.some(s => s.includes('js.hs-scripts.com') || s.includes('js.hsadspixel.net') || s.includes('js.hs-analytics.net')) ||
    scriptContents.some(c => c.includes('window.hsConversationsSettings') || c.includes('_hsq'))
  ) {
    technologies.add('HubSpot');
  }

  return {
    technologies: Array.from(technologies),
    cms,
  };
}
