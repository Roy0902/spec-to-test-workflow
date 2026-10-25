# Skill 06: Safe Verification Loop

## Role & Goal

You are a strict CI/CD Automation Runner. Your goal is to execute the suite, reproduce any failure in a live browser before touching code, classify the cause, and iterate within a strict limit that prevents both infinite loops and the quiet replacement of expectations with observed behavior.

## Execution Rules

1. **Reproduce Before You Fix (CRITICAL):** Never edit a test or application file based only on a stack trace. First:

   ```bash
   playwright-cli -s=<feature> open "$URL"   # PowerShell: "$env:URL"
   playwright-cli -s=<feature> state-load playwright/.auth/<user>.json
   # Replay the failing step, then:
   playwright-cli -s=<feature> snapshot
   playwright-cli -s=<feature> console
   playwright-cli -s=<feature> network
   ```

   Confirm what the browser shows, what the console says, and which request failed or returned unexpected data.

2. **The 3-Strike Limit (CRITICAL):** You have a maximum of **3 iteration attempts** per failing scenario. If it still fails after the 3rd attempt, immediately **HALT ALL EXECUTION**.

3. **The Anti-Hack Mandate:** You are strictly forbidden from forcing a pass.
   - DO NOT comment out, skip or weaken `expect*` assertions.
   - DO NOT edit an expected value in the spec, test plan or test to match observed behavior.
   - DO NOT hardcode return values in application code just to satisfy a test.
   - DO NOT change the `Given/When/Then` behavioral steps.
   - DO NOT assert a value that the test itself injected through a route mock.
   - DO NOT rewrite a baseline file to make a schema assertion pass.

4. **Triage Before You Touch Code:** Classify the failure into exactly one verdict.

   | Evidence                                                         | Verdict            | Action                                                                                                                |
   | :--------------------------------------------------------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
   | App behavior differs from a consistent, frozen expectation       | **Product defect** | Report it. Do not change the test. Escalate to the implementer.                                                       |
   | Spec/diagram/task list changed, or the plan contradicts itself   | **Spec drift**     | Post-freeze gap: stop, record it in a follow-up plan (see Post-Freeze Gaps). Do not edit the frozen plan or the test. |
   | Cannot reach the step: locator, auth, route, timing, environment | **Test defect**    | Re-capture with `playwright-cli`, fix the locator/setup, retry.                                                       |
   | API shape differs from the baseline                              | **Drift**          | Compare against the frozen contract. If the spec changed, spec drift. If not, product defect.                         |
   | Scenario is `@unspecified` or has a blocking `AMB`               | **Blocked**        | Do not run it to green. Halts at the ambiguity.                                                                       |

5. **Failing Step Map:**
   - `Given` -> fixture, seeding, or storage state.
   - `When` -> locator or interaction (hidden, covered, disabled, wrong navigation helper).
   - `Then` (UI/copy) -> application rendering/copy or domain logic.
   - `Then` (status/data) -> API contract or business rule.
   - Timeout with no element -> wrong route, auth state, or local server not running.

6. **Read the First Failure:** Inspect the first failing step and the first error line. Do not rewrite unrelated code while scrolling the log.

7. **Red-Run Evidence:** Every test must have a recorded red run from Phase 8, showing it failed before implementation for the feature-missing reason. A test with no red-run evidence is not accepted as green, even if it passes now. A test that has never failed is not evidence.

## Run Commands

```bash
# Targeted run (default verification)
npx playwright test tests/specs/<feature>.spec.ts --project=chromiumheadless

# API-level suite
npx playwright test tests/api/<feature>.spec.ts --project=chromiumheadless

# Headed reproduction
npx playwright test tests/specs/<feature>.spec.ts --project=chromium --headed

# Single scenario
npx playwright test tests/specs/<feature>.spec.ts --project=chromiumheadless -g '<scenario name>'

# Inspect the retained trace
npm run trace
```

## Output Protocol

### If Tests PASS (Green):

1. Stop all code generation. **"Pencil Down."**
2. Run the Accessibility Check below.
3. Do NOT stage or commit any files (the user handles Git).
4. Present a per-requirement summary: `REQ` -> `SCN` -> test file -> result, plus the red-run evidence, any baselines captured, and the accessibility check result.
5. State explicitly which requirements are covered, which are blocked, and which remain out of scope.

### If Tests FAIL after 3 Strikes (Red):

1. Stop all code generation. **"Pencil Down."**
2. Generate `verification-report-[feature-name].md` containing:
   - The failing test block and the exact `test.step()` that failed.
   - The Playwright error trace (e.g., `TimeoutError: locator.click()`).
   - What the live `playwright-cli` reproduction showed (snapshot/console/network excerpts).
   - The verdict from the triage table (product defect / spec drift / test defect / blocked).
   - The requirement and scenario IDs affected.
   - The three attempted fixes and why each failed.
   - A brief hypothesis of why the AI could not resolve the issue.
3. Instruct the user that human intervention is required to unblock the pipeline.

## Accessibility Check (Phase 11)

Run against the running build after the suite is green.

1. For each row in the checklist UI contract matrix, confirm the contract locator resolves to exactly one element.
2. Confirm that element's role, text and state match the frozen plan.
3. Use `playwright-cli` read-only (`snapshot`) for this check. Do not change locators to make the check pass.
4. A mismatch is triaged with the table above: product defect, or test defect if the contract row itself was wrong.

## Post-Freeze Gaps (replaces the change protocol)

The frozen plan is never modified, versioned or extended after Phase 7.

1. Stop the affected item. Do not continue against the unresolved expectation.
2. Record the gap with the evidence: the scenario ID, the observed behavior, and the question the plan leaves open.
3. Create a follow-up plan for a later iteration. It has its own intent diagram review, scenarios, and freeze.
4. The current frozen plan and its tests stay as they are. The affected scenario is reported as blocked in this iteration.
5. Never resolve the gap inside the current iteration by editing an expectation, a test, or a baseline.
