# Test Plan: [Feature Name]

> **Frozen artifact.** Derived only from the specification and the approved intent diagram. Implementation code, running-app observations, network captures and task lists may not change anything below. This file is never modified, versioned or extended after freeze. Gaps found later go to a follow-up plan (see `.ai/skills/06-verification-loop.md`, Post-Freeze Gaps).

## 1. Provenance

| Field                        | Value                                                         |
| :--------------------------- | :------------------------------------------------------------ |
| Feature                      | `[feature-name]`                                              |
| Spec artifact                | `[path]` @ `[version/hash]`                                   |
| Intent diagram (Phase 2)     | `[path]` @ `[version/hash]`, user-approved on `[date]`        |
| Checklist (Phase 4)          | `[path]` @ `[version/hash]`                                   |
| Frontend task list (Phase 5) | `[path]` @ `[version/hash]` (scope only)                      |
| Backend task list (Phase 5)  | `[path]` @ `[version/hash]` (scope only)                      |
| Requirement source           | `.ai` Skill 00 output @ `[date]`                              |
| Frozen by                    | `[name]`                                                      |
| Frozen at                    | `[YYYY-MM-DD]`                                                |
| Post-freeze gaps             | `[follow-up plan path(s), or none]`. This file is not edited. |

## 2. Scope

**In scope:**

- `[Journey / surface / endpoint]`

**Out of scope (explicit):**

- `[Reason]`

## 3. Requirement Register

| ID                  | Requirement         | Type                          | Source     | Level           | Testability |
| :------------------ | :------------------ | :---------------------------- | :--------- | :-------------- | :---------- |
| `REQ-[feature]-001` | `[Observable rule]` | Rule / Flow / Data / Contract | `[spec §]` | UI / API / Both | Testable    |

## 4. Scenarios (Oracle)

_Every expected value below is concrete and observable. "Works correctly" is not an expectation._

| ID                  | REQ                 | Type     | Gherkin                       | Expected Observable                  | Data Needs               | Tag      |
| :------------------ | :------------------ | :------- | :---------------------------- | :----------------------------------- | :----------------------- | :------- |
| `SCN-[feature]-001` | `REQ-[feature]-001` | Positive | `Given ... When ... Then ...` | `[exact copy / URL / value / state]` | `[user, seed, endpoint]` | `@smoke` |
| `SCN-[feature]-002` | `REQ-[feature]-002` | Negative | `Given ... When ... Then ...` | `[exact error copy / status]`        | `[seed]`                 | `@reg`   |
| `SCN-[feature]-003` | `REQ-[feature]-003` | Boundary | `Given ... When ... Then ...` | `[limit behavior]`                   | `[boundary value]`       | `@reg`   |

### State Transitions (from Mermaid)

| From        | To          | Guard / Condition      | Scenario ID | Covered |
| :---------- | :---------- | :--------------------- | :---------- | :------ |
| `[State A]` | `[State B]` | `[Guard]`              | `SCN-...`   | Yes/No  |
| `[State B]` | `[State B]` | `[Invalid transition]` | `SCN-...`   | Yes/No  |

## 5. API Contract Coverage

| Endpoint          | Method | Auth           | REQ       | Expected Status | Expected Shape / Errors  | Baseline                                                |
| :---------------- | :----- | :------------- | :-------- | :-------------- | :----------------------- | :------------------------------------------------------ |
| `/api/[resource]` | GET    | session cookie | `REQ-...` | `200`           | `{ id, items[], total }` | `tests/testdata/api/[feature]/[resource].baseline.json` |

## 6. Data Plan

| Role         | Storage State                  | Seed Required | Reset Strategy       |
| :----------- | :----------------------------- | :------------ | :------------------- |
| `[standard]` | `playwright/.auth/[user].json` | `[dataset]`   | `[per-test / suite]` |

## 7. Coverage Summary

| Metric                | Target             | Planned |
| :-------------------- | :----------------- | :------ |
| Requirements covered  | `100%` of testable | `[n/n]` |
| Positive scenarios    | >= 1 per REQ       | `[n]`   |
| Negative / boundary   | Applicable         | `[n]`   |
| Guarded transitions   | `100%`             | `[n/n]` |
| Invariant violations  | >= 1 per invariant | `[n]`   |
| Endpoints             | >= 1 API test each | `[n/n]` |
| E2E `@smoke` journeys | Critical paths     | `[n]`   |

## 8. Assumptions & Ambiguities

| ID                  | Assumption / Question | Impact       | Blocking | Decision                      |
| :------------------ | :-------------------- | :----------- | :------- | :---------------------------- |
| `AMB-[feature]-001` | `[assumption]`        | High/Med/Low | Yes/No   | `[Pending / Approved by ...]` |

## 9. Red-Run Evidence

_Every test must fail before implementation for the feature-missing reason. One row per test; fill during Phase 8. Expectations in this file are not edited here._

| Scenario / Test     | Red failure before implementation | Reason category | Date     |
| :------------------ | :-------------------------------- | :-------------- | :------- |
| `SCN-[feature]-001` | `[error, e.g. element not found]` | Feature missing | `[date]` |

## 10. Freeze Sign-off

- [ ] Every requirement is testable or explicitly blocked.
- [ ] Every expected value is concrete and sourced from the spec or the approved intent diagram.
- [ ] No expected value came from code, a capture or a running app.
- [ ] No blocking ambiguity remains unresolved.
- [ ] Coverage targets met or justified.
- [ ] Intent diagram version recorded and approved.
- [ ] Freeze stamp recorded (`Frozen by` / `Frozen at` above). No edits after this point.
