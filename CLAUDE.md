# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server at http://localhost:4200/ (alias for `ng serve`).
- `npm run build` — production build. **Outputs to `docs/`** with `baseHref` `/dtvu94.github.io/`; both are configured in `angular.json` under the `build` target's `outputPath` (`base: "docs"`, `browser: ""` to flatten) and `baseHref`. Do not move these to CLI flags — keeping them in `angular.json` means `ng build` and any tooling that reads the workspace see the same paths.
- `npm test` — Jest (jsdom). Single file: `npx jest src/app/app.component.spec.ts`. Watch: `npx jest --watch`.
- `npm run test:cov` — Jest with coverage.

## Deployment

The site is published via GitHub Pages directly from the committed `docs/` directory on `master`. Shipping a change means: build → commit the updated `docs/` artifacts → push. The `baseHref` is hardcoded for the `dtvu94.github.io` repo path, so the bundle in `docs/` only works under that URL. The empty `docs/prerendered-routes.json` is an artifact of the `application` builder — harmless to serve, leave it in place.

## Architecture

Angular 21 SPA using the new `@angular/build:application` builder (esbuild-based). Still uses the classic NgModule bootstrap (`AppModule` in `src/app/app.module.ts`), not standalone components — the v19 migration explicitly set `standalone: false` on `AppComponent` to preserve this. Currently a skeleton: empty `Routes` array in `app-routing.module.ts` and a single `AppComponent`. Component selector prefix is `app` (set in `angular.json`).

## Testing

Jest + `jest-preset-angular` v16 (Zone.js variant), not Karma. Setup lives in `jest.config.js` (CJS — `.ts` doesn't work without ESM gymnastics because `jest-preset-angular/presets` is a directory import) and `setup-jest.ts` (calls `setupZoneTestEnv()`). `angular.json` has no `test` target — Jest runs directly, bypassing the Angular CLI.
