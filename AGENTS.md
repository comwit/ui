# Comwit Ui

This repository is independently installable and may also be checked out as
`packages/ui` in `comwit/comwit`. Keep public package names and APIs stable.

Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test` and `pnpm typecheck`.
Commit and open PRs in this repository, then update the parent submodule pointer
in a separate parent PR. Never mix another repository's or user's changes.

`core/` owns UI behavior and icons; `templates/` owns editable components;
`cli/` owns the installer. `apps/storybook/` owns the examples consumed by the
parent docs; `apps/ui-dev/` is the development catalog. Edit icon definitions,
not generated icon entries. Generate registry and stories from source.
UI must remain independent of State.
