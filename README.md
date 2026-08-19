# cipp-tui

Terminal UI for browsing a [CIPP](https://cipp.app) instance. Ink + React, talks to the CIPP API directly.

## Run

```sh
npm ci
npm run dev
```

First run walks through setup: paste your CIPP instance URL, pick an auth method. Config persists via `conf`, so setup only appears once.

```sh
npm run reset   # clear stored config and tokens, rerun setup
npm test
```

## Auth

- `pkce` (default): sign in with your browser. App registration, endpoints, and scopes are discovered from the instance, nothing to configure.
- `oauth`: client credentials. Needs tenant id, client id, client secret, and scope.
- `none`: no credentials sent (local dev instances).

## Keys

- `Tab` / `1`-`2` switch tabs (Tenants, Users)
- `t` jump to tenant list
- `q` quit
