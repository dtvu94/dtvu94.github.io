# MyEngineer

Personal site at https://dtvu94.github.io/ — an Angular 21 SPA served by GitHub Pages from this repo's `docs/` directory.

## Development server

`npm start` — runs the dev server at http://localhost:4200/ with live reload.

## Build

`npm run build` — production build straight into `docs/` with the correct GitHub Pages base href. Commit the resulting `docs/` changes and push to deploy.

Output path and base href are configured in `angular.json` (`build.options.outputPath` and `build.options.baseHref`), not as CLI flags.

## Tests

`npm test` — runs Jest (with `jest-preset-angular`, jsdom environment).
`npm run test:cov` — same with coverage.

Run a single spec: `npx jest src/app/app.component.spec.ts`.

## Scaffolding

`ng generate component component-name` (also `directive|pipe|service|class|guard|interface|enum|module`).

## Stack

- Angular 21 (NgModule-based, not standalone)
- `@angular/build:application` builder (esbuild)
- Jest 30 for unit tests
- TypeScript 5.9
