# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server at http://localhost:4200/ (alias for `ng serve`).
- `npm run build` — production build. **Outputs to `docs/`** with `baseHref: "/"` (because this repo is a user/org GitHub Pages site served at the apex `https://dtvu94.github.io/`, and the Actions workflow uploads only `docs/` as the artifact root). Both are configured in `angular.json` under the `build` target's `outputPath` (`base: "docs"`, `browser: ""` to flatten) and `baseHref`. If you ever turn this into a project-page repo, the base href must change to `/<repo-name>/`.
- `npm test` — Jest (jsdom). Single file: `npx jest src/app/app.component.spec.ts`. Watch: `npx jest --watch`.
- `npm run test:cov` — Jest with coverage.

## Deployment

The site is published via the GitHub Actions workflow at `.github/workflows/static.yml`, which uploads `docs/` as the Pages artifact on every push to `master`. Shipping a change means: build → commit the updated `docs/` artifacts → push; the workflow takes care of the rest. The empty `docs/prerendered-routes.json` is an artifact of the `application` builder — harmless to serve, leave it in place.

## Architecture

Angular 21 SPA using the new `@angular/build:application` builder (esbuild-based). Still uses the classic NgModule bootstrap (`AppModule` in `src/app/app.module.ts`), not standalone components — the v19 migration explicitly set `standalone: false` on `AppComponent` to preserve this. Currently a skeleton: empty `Routes` array in `app-routing.module.ts` and a single `AppComponent`. Component selector prefix is `app` (set in `angular.json`).

## Testing

Jest + `jest-preset-angular` v16 (Zone.js variant), not Karma. Setup lives in `jest.config.js` (CJS — `.ts` doesn't work without ESM gymnastics because `jest-preset-angular/presets` is a directory import) and `setup-jest.ts` (calls `setupZoneTestEnv()`). `angular.json` has no `test` target — Jest runs directly, bypassing the Angular CLI.
