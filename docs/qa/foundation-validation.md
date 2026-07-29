# Foundation validation

Date: 2026-07-29
Branch: `foundation/astro-site`

## Automated validation

The foundation validation sequence covers:

- Locked dependency installation
- Node test suite
- Design-token contract
- Portfolio asset checks
- Structured project-content checks
- Astro diagnostics
- TypeScript diagnostics
- Static production build
- Built-route and metadata verification

## Route review

Reviewed routes:

- `/`
- `/services`
- `/work`
- `/about`
- `/process`
- `/start`

Reviewed viewport widths:

- 390px
- 430px
- 768px
- 1440px

Confirmed during rendered-page review:

- No horizontal overflow
- Mobile and desktop navigation use the correct layouts
- The mobile menu opens and exposes all six navigation links
- The skip link is the first keyboard-focusable control
- Reduced-motion preferences disable smooth scrolling
- Every route has one clear page heading and the expected document title
- Internal route requests and committed assets resolve without console errors
- Good Intentions is labeled as work in progress
- The Start Your Project page does not imply that live form submission is active

## Asset correction

The master Calypso logo was rebuilt directly from the supplied source image as an optimized WebP. The About page, social metadata, and asset validation reference the corrected file.

## Deferred work

- Complete individual case-study pages
- Interactive multi-step intake wizard
- Live email delivery and spam protection
- Final horizontal and single-color logo derivatives
- Custom-software case study
- Production domain, canonical URLs, sitemap, and analytics
