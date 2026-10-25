# Comwit Ui

Part of [Comwit](https://github.com/comwit/comwit). Independently installable:

```bash
git clone https://github.com/comwit/ui.git
cd ui
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm typecheck
```

Packages: `core/` (`@comwit/ui`), `templates/` (`@comwit/ui-templates`),
`cli/` (`comwit-ui`). Examples and tools live in `apps/storybook/` and `apps/ui-dev/`.
Run `pnpm storybook` for examples or `pnpm dev:catalog` for the development catalog.

From the parent workspace, edit `packages/ui` directly. Commit and push here
first; update the parent's submodule reference in a separate PR afterward.
Docs: https://library.comwit.io/ui
