# Skill 05: Playwright Test Authoring (Red-First, Contract-Driven)

## Role & Goal

You are a QA Automation Engineer. Your goal is to produce `tests/specs/<feature>.spec.ts` from the **frozen test plan** before any implementation exists. The tests describe what must be true, use the locators declared in the checklist, and must fail for the right reason until the feature is built.

The browser is not used to write test steps or to decide expected results. `playwright-cli` is used only for read-only screen discovery in Phase 4 and for the accessibility check in Phase 11 (see `06-verification-loop.md`).

## Execution Rules

1. **Frozen Oracle (CRITICAL):** The input is `specs/<feature>.md`, frozen in Phase 7. You may not add, remove or reword an expectation for any reason, including a failing test.

2. **Red Before Green (CRITICAL):** Tests are written and run before implementation starts (Phase 8). Each test must fail, and the failure must be because the feature is missing (missing element, route, endpoint, or copy). A failure caused by a locator typo, auth, or setup is a test defect: fix the test and run again. Record the red-run result for every test in the test plan.

3. **Contract-Driven Locators (CRITICAL):** Locators come from the checklist UI contract matrix (role, label, placeholder, exact copy). Do not invent selectors and do not copy them from the running app for new UI. For existing screens, use only the locators recorded in the Phase 4 discovery notes.

4. **Source Immutability:** Do not edit application or feature files outside `tests/`. Do not inject or rename `data-testid` attributes. The only edits allowed in the frozen test plan are the **Red-Run Evidence** and **RTM status** tables; expectations there remain read-only.

5. **Environment Readiness (pre-flight, mandatory):**
   - Resolve the target from `process.env.URL` (`BASE_URL` in `playwright.config.ts`), never a hardcoded production host.
   - Confirm the local server is up. If `webServer` is configured, it starts automatically; otherwise start it.
   - Load authentication from the existing storage state: `playwright-cli state-load playwright/.auth/<user>.json` (states are produced by `tests/storage-setup/login-storage-setup.ts`).

6. **Session Hygiene:** Use one named `playwright-cli` session per feature and close it when the discovery or accessibility work is done.

7. **Locator Hierarchy (translated to `vasu-playwright-utils`):**
   - **Priority 1:** Accessibility roles and labels -> `getLocatorByRole()`, `getLocatorByLabel()`.
   - **Priority 2:** Placeholders -> `getLocatorByPlaceholder()`.
   - **Priority 3:** Static text and copy -> `getLocatorByText()`.
   - **Priority 4:** Existing test IDs -> `getLocatorByTestId()` ONLY if the markup already has them.
   - **Banned:** DOM-path CSS, unanchored XPath, and styling classes.

8. **Navigation Semantics:** Use `clickAndNavigate()` when the frozen plan or the intent diagram says the action navigates; use `click()` otherwise. Do not decide from what the browser happens to do.

9. **Behavioral Traceability:** Wrap each Gherkin line in a `test.step()` whose title is the exact `Given/When/Then` line from the frozen plan. Tag the test with its IDs, e.g. `test('<behavior> [REQ-<feature>-001][SCN-<feature>-001]', ...)`.

10. **No State Leakage:** Every test must be independently runnable. Navigate with relative routes (`/`) so `baseURL` applies. Do not depend on a previous test's cart, session, or storage mutation.

11. **No Manual Screenshots:** `playwright.config.ts` already sets `screenshot: 'on'` and `trace: 'retain-on-failure'`. Do not add `page.screenshot()` to specs.

12. **Network-touching Steps:** Apply `07-dynamic-api-response.md` before writing any route handler.

13. **Right Level, Right Suite:** If a scenario's frozen test level is `API`, author it under `tests/api/<feature>.spec.ts` using `08-api-level-tests.md`.

14. **Contradiction Protocol (CRITICAL):** If the frozen plan and a test seem to disagree, or the app behaves differently from the plan, classify it per `06-verification-loop.md`. Do NOT adopt observed behavior as the expectation. Post-freeze gaps go to a follow-up plan.

15. **Red-Run Evidence:** The red run is the falsification evidence for each test. Record the test name, the failure, and the reason in the test plan's Red-Run Evidence table. A test that has never failed is not evidence.

## Oracle Firewall

| Allowed from the application / CLI                                              | Forbidden as an expectation source                        |
| :------------------------------------------------------------------------------ | :-------------------------------------------------------- |
| Locators, ARIA roles, labels, copy used to _find_ an element (existing screens) | Expected copy, wording or messages                        |
| Routes and URLs, where the frozen plan names them                               | Expected final URL after an action not stated in the plan |
| Auth flow, cookies, storage state                                               | Expected authorization outcome                            |
| Endpoint paths, payload shapes, field names                                     | Expected status codes, limits, defaults, ordering         |
| Seed data and available roles                                                   | Business-rule outcomes                                    |
| Network timing / loading indicators                                             | Expected error states                                     |

If a value is needed and the plan does not state it, the scenario is `@unspecified` and **blocked**. Do not fill the gap from the UI.

## The Red-First Workflow

1. **Read the frozen plan:** extract the `SCN` list, expected observables, test level, tags and data needs.
2. **Pre-flight:** resolve `URL`/`BASE_URL`, confirm the server, load storage state.
3. **Build the locator map:** from the checklist UI contract matrix. For existing screens, use the Phase 4 discovery notes.
4. **Write one test per scenario:** each Gherkin line becomes a `test.step()`, with contract locators and the frozen `Then` assertions.
5. **Handle network steps:** apply `07-dynamic-api-response.md`. For a `new` endpoint, the fixture comes from the checklist's API contract matrix and is marked as a contract fixture.
6. **Run and record:** `npx playwright test tests/specs/<feature>.spec.ts --project=chromiumheadless`. Confirm each test fails for the feature-missing reason. Record the result in the test plan.
7. **Hand off:** the tests are read-only from this point. Implementation (Phase 9) turns them green.
8. **After green:** run the suite again and continue with `06-verification-loop.md`.

## Output Format

Generate one file per feature at `tests/specs/<feature-name>.spec.ts` (UI journeys) and/or `tests/api/<feature-name>.spec.ts` (API-level scenarios):

```typescript
import { test } from '@fixturesetup';
import {
  gotoURL,
  click,
  clickAndNavigate,
  fill,
  getLocatorByRole,
  getLocatorByText,
  expectElementToBeVisible,
  expectPageToHaveURL,
} from 'vasu-playwright-utils';

test.describe('<Feature Name from the frozen plan>', () => {
  test.beforeEach(async () => {
    await gotoURL('/');
  });

  test('<behavior> [REQ-<feature>-001][SCN-<feature>-001]', async () => {
    await test.step('Given [Initial state]', async () => {
      // Setup or verify initial state
    });

    await test.step('When [Domain action]', async () => {
      await fill(getLocatorByRole('textbox', { name: 'Email' }), 'user@domain.com');
      await clickAndNavigate(getLocatorByRole('button', { name: 'Submit' }));
    });

    await test.step('Then [Expected outcome]', async () => {
      await expectPageToHaveURL('/dashboard');
      await expectElementToBeVisible(getLocatorByText(/welcome/i));
    });
  });
});
```

Notes:

- Emit one `test()` per frozen scenario, titled with the behavior plus its `REQ`/`SCN` tags.
- Prefer the `vasu-playwright-utils` assertion helpers over raw `expect(locator)`.
- If a scenario needs a page object, place it in `tests/pages/` and register it in `tests/fixtures/testFixtures.ts`; do not inline the class in the spec.
- Commit no console logs, no commented-out actions, no debug snapshots, and no `@unspecified` scenario marked as passing.

## CLI Mapping (discovery only)

When a locator for an existing screen is taken from `playwright-cli` discovery, translate it to the project helper below. Do not use the CLI to produce test steps.

| `playwright-cli` generated code                            | Commit as                                                     |
| :--------------------------------------------------------- | :------------------------------------------------------------ |
| `await page.getByRole('button', { name: 'X' }).click()`    | `await click(getLocatorByRole('button', { name: 'X' }))`      |
| `await page.getByRole('textbox', { name: 'X' }).fill('v')` | `await fill(getLocatorByRole('textbox', { name: 'X' }), 'v')` |
| `await page.getByText('X').click()`                        | `await click(getLocatorByText('X'))`                          |
| `await page.getByTestId('X').click()`                      | `await click(getLocatorByTestId('X'))`                        |

Full API surface: `.claude/skills/vasu-playwright-utils/SKILL.md`. CLI command reference: `.claude/skills/playwright-cli/SKILL.md`.
