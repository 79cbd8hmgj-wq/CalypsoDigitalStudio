# Portfolio image quality upgrade

The initial portfolio captures were reduced to 460 × 833 pixels and embedded inside SVG wrappers. That conversion made text and photography look soft on larger displays.

This follow-up regenerates the same approved crops directly from the original PDFs as 1242 × 2250 WebP files at quality 90. The new captures preserve substantially more detail while remaining small enough for normal website delivery.

## Verification

- Six direct WebP assets replaced the former SVG wrappers.
- Intrinsic image dimensions were updated to 1242 × 2250.
- Asset, content, Astro, TypeScript, production-build, and build-output checks passed during generation.
- A final GitHub Actions run is required on the completed branch before merge.
