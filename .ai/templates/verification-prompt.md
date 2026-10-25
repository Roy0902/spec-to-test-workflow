# Phase 10: Safe Verification Loop Execution Prompt

You are tasked with running and verifying the Playwright suite for the newly implemented feature, adhering strictly to the Safe Verification Loop protocol.

## Input Files

1. Frozen test plan: `specs/[feature-name].md`
2. Target test scripts: `tests/specs/[feature-name].spec.ts` and/or `tests/api/[feature-name].spec.ts`
3. Skill rules: `.ai/skills/06-verification-loop.md`

## Pre-flight

- Confirm the local server is running and `URL`/`BASE_URL` points at it.
- Confirm the test plan is **FROZEN** and that every test has red-run evidence from Phase 8.

## Protocol & Guardrails

1. **Initial Run:** `npx playwright test tests/specs/[feature-name].spec.ts --project=chromiumheadless` (and the API suite if present).
2. **If Tests Pass:** Run the Accessibility Check (Phase 11, per `06-verification-loop.md`). Report per requirement: `REQ` -> `SCN` -> test -> result, with the red-run evidence and the accessibility check result. Complete the task.
3. **If Tests Fail:**
   - Reproduce live before editing:
     ```bash
     playwright-cli -s=[feature] open "$env:URL"
     playwright-cli -s=[feature] state-load playwright/.auth/[user].json
     playwright-cli -s=[feature] snapshot
     playwright-cli -s=[feature] console
     playwright-cli -s=[feature] network
     ```
   - Triage the failure into exactly one verdict:
     - **Product defect** — app contradicts a consistent frozen expectation. Report; do not change the test.
     - **Spec drift** — spec/diagram changed or the plan contradicts itself. Post-freeze gap: stop and record it in a follow-up plan. Do not edit the frozen plan or the test.
     - **Test defect** — locator, auth, timing or environment. Re-capture and fix the test.
     - **Blocked** — `@unspecified` or a blocking `AMB`. Do not force it green.
   - Apply one precise fix per attempt, then re-run.

## CRITICAL: The 3-Strike Rule

- You are allowed a maximum of **3 attempt iterations** per failing scenario.
- **FORBIDDEN ACTIONS:**
  - DO NOT edit an expected value to match observed behavior.
  - DO NOT comment out, skip or weaken assertions.
  - DO NOT rewrite a baseline file to make a schema assertion pass.
  - DO NOT hardcode application values just to force a pass.
  - DO NOT alter the frozen business rules from Phase 1/3/7.
- **Circuit Breaker:** If the scenario fails on the 3rd attempt, **HALT IMMEDIATELY**. Do not make further edits. Generate `verification-report-[feature-name].md` containing:
  1. The failing scenario, `test.step()` and stack trace.
  2. The triage verdict (product defect / spec drift / test defect / blocked).
  3. What the live `playwright-cli` reproduction showed (snapshot/console/network).
  4. The affected `REQ`/`SCN` IDs.
  5. Attempted fixes across the 3 strikes.
  6. Explicit request for human developer review.
