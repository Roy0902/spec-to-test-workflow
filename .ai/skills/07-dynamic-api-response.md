# Skill 07: Dynamic API Response Capture & Live Mocking

> Supporting skill invoked by Phase 4 (existing endpoints: baseline), Phase 8 (red tests) and Phase 10 (verification). It is not a pipeline phase.

## Role & Goal

You are an API-aware test engineer. Your goal is to make every mocked response in a spec **derived from the real local server**, not invented. You first execute the endpoint against the running application, record the actual response as a baseline, and then mock at test time with **live passthrough + mutation**: let the request hit the local server, intercept the real response, change only the field the scenario needs, and fulfill with the mutated body.

## Execution Rules

1. **Local-Only Capture (CRITICAL):** Capture exclusively against the local/dev server resolved from `process.env.URL` or `BASE_URL`. Production or shared staging hosts are forbidden. If the host is not `localhost`, `127.0.0.1`, or an explicitly allow-listed dev host, stop and ask.

2. **Derive-Then-Mock (CRITICAL):** Never write a route handler for an **existing** endpoint you have not executed in this session. Baseline first, mutation second. The baseline defines the **shape**; the frozen test plan (`specs/<feature>.md`) defines the **expected outcome**. A captured value never becomes an assertion.

   **New endpoints (not yet built):** they cannot be executed, so in Phase 8 the fixture is built from the checklist's API contract matrix (derived from the spec), not from a capture. Mark the fixture as a contract fixture in its meta file. The red test must fail with the feature-missing reason. Once the endpoint exists, replace the fixture with the passthrough + mutation workflow below and re-run.

3. **Baseline Is Shape, Not Oracle (CRITICAL):** Use the baseline to learn field names, types, nesting and nullable paths. Its concrete values are illustrative. If the plan does not state an expected result for a mutated field, the scenario is `@unspecified` and blocked — do not infer the expectation from what the server happened to return.

4. **Recognized Auth:** Reuse the signed-in session via `playwright-cli state-load playwright/.auth/<user>.json`. Note in the baseline meta whether the request needs cookies, a bearer token, or no auth. If you strip auth (`--remove-header=cookie,authorization`), do it deliberately to test the unauthenticated path.

5. **Assert the Application, Not the Mock:** Never assert a value you injected as if it were application behavior. Mutations exist to drive a UI state; the assertion verifies how the UI reacts.

6. **Stable Fields Only:** Baseline ids, timestamps, prices and counts are volatile. Either mutate them deterministically or match them with patterns (`/\d+/`), never copy-paste exact values into `expect*`.

7. **No Secrets in Repository:** Redact cookies, tokens, API keys, emails and personal data in baseline files. Record what was redacted in the meta file.

8. **Fallback Is Opt-In:** A baseline may be used as a static fallback when the server is unavailable, but only with an explicit comment saying so. The default path is passthrough.

## Workflow

### 1. Discover the contract

```bash
playwright-cli -s=<feature> open "$URL"
playwright-cli -s=<feature> state-load playwright/.auth/<user>.json
# Reproduce the scenario step that triggers the request, then:
playwright-cli -s=<feature> network
```

Record: method, path, query params, request headers, request body, status, content type, and whether the response is required for the UI state under test.

### 2. Execute against the local server

```bash
playwright-cli -s=<feature> run-code "async page => {
  const res = await page.request.get('/api/<resource>');
  return { status: res.status(), body: await res.json() };
}"
```

Use `page.request`, not an external HTTP client, so cookies and the `baseURL` from `playwright.config.ts` apply automatically. For POST/PUT, pass the real payload shape observed in step 1.

### 3. Persist the baseline

Create `tests/testdata/api/<feature>/` and save:

- `<endpoint>.baseline.json` — the real response body (sanitized).
- `<endpoint>.meta.json` — method, path, auth mode, captured-at, source URL, sanitized fields, schema notes.

When a scenario needs a genuinely different starting payload (for example an empty cart versus a populated cart), add a variant instead of editing the default baseline:

- `<endpoint>.<scenario>.baseline.json`

One baseline per endpoint; variants only where the scenario's starting state differs. Baselines are review artifacts, drift references, and optional fallbacks — they are not the primary mock source.

### 4. Identify mutation points

Read the expected outcome and the scenario ID from the frozen test plan first. Then list the minimum fields the scenario must change, for example:

| Field               | Baseline value | Scenario value | Why                       | Expected outcome (from plan)  |
| :------------------ | :------------- | :------------- | :------------------------ | :---------------------------- |
| `items[0].quantity` | `1`            | `99`           | quantity limit validation | `"Maximum quantity exceeded"` |
| `user.tier`         | `"standard"`   | `"pro"`        | feature gating badge      | `"Pro Tier"` badge visible    |
| `status`            | `"ok"`         | `"error"`      | failure banner copy       | `"Payment failed"`            |

If the "Expected outcome" column cannot be filled from the plan, stop — the scenario is `@unspecified` and blocked.

### 5. Implement passthrough + mutation

```typescript
import { test } from '@fixturesetup';
import { gotoURL, clickAndNavigate, getLocatorByRole, expectElementToHaveText } from 'vasu-playwright-utils';
import type { Page } from '@playwright/test';

async function mutateResponse(page: Page, urlPattern: string, mutate: (body: any) => void): Promise<void> {
  await page.route(urlPattern, async route => {
    const response = await route.fetch(); // real local server response
    const body = await response.json();
    mutate(body);
    await route.fulfill({ response, json: body });
  });
}

test('<behavior> [REQ-<feature>-001][SCN-<feature>-001]', async ({ page }) => {
  await mutateResponse(page, '**/api/cart', body => {
    body.items[0].quantity = 99;
  });

  await gotoURL('/cart');
  await clickAndNavigate(getLocatorByRole('button', { name: 'Checkout' }));
  await expectElementToHaveText(getLocatorByText(/maximum/i), 'Maximum quantity exceeded');
});
```

`page.route` and `route.fetch` are the one place raw Playwright APIs are allowed inside a spec, because `vasu-playwright-utils` does not wrap network mocking. Import `Page` only as a type.

### 6. Variants

| Goal                                | Pattern                                                                                                   |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| Different response per request body | `page.route(pattern, route => route.request().postDataJSON().role === 'admin' ? fulfillA() : fulfillB())` |
| Offline / network failure           | `route.abort('internetdisconnected')`                                                                     |
| Slow loading state                  | `await new Promise(r => setTimeout(r, 3000))` inside the route handler                                    |
| Server error copy                   | `route.fulfill({ status: 500, json: { message: '...' } })`                                                |
| Drift check                         | `const live = await route.fetch();` compare key shape to the baseline, log a diff                         |

### 7. Verify

```bash
npx playwright test tests/specs/<feature>.spec.ts --project=chromiumheadless
```

If the test fails on an API-driven step, capture the live response again before editing anything. Then classify it per `06-verification-loop.md`. If the frozen plan is wrong, record a post-freeze gap in a follow-up plan. If it is not, the mismatch is a product defect or test defect — never a reason to rewrite the baseline or the expectation.

## Anti-Patterns

- Hardcoding an invented JSON payload before observing the real response.
- Mocking the endpoint that is the behavior under test (for example mocking the login endpoint while testing login validation).
- Capturing from production or copying real customer data into the repository.
- Asserting on a mutated value instead of on rendered UI or application state.
- Copying a captured value into an `expect*` because "that is what the server returns".
- Rewriting a baseline or expectation to make a schema assertion pass.
- Leaving `playwright-cli` route mocks active in the CLI session when the next scenario expects the real server.
- Adding a static fallback without a comment explaining why.

## Exit Criteria

- Every mocked endpoint has a baseline + meta file under `tests/testdata/api/<feature>/`.
- Every mutation row has an expected outcome sourced from the frozen test plan.
- The spec's route handlers use passthrough + mutation by default.
- The spec passes with the server running and, where a fallback is declared, with it stopped.
- No secrets, cookies or production data are committed.
