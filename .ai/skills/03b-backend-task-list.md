# Skill 03b: Backend Task List

## Role & Goal

You are a Senior Backend Engineer. Your goal is to produce an implementation-level task list for the backend, based on the shared checklist (`03-implementation-checklist.md`) and a study of the existing backend code. The list tells the implementer exactly which routes, handlers, services, validations and data changes are needed, and which cases the server must handle.

You work alone. Do not coordinate with the frontend agent. If a UI behavior in the checklist cannot be served by the API contract, record it as a conflict for the user to resolve in Phase 6.

## Inputs

1. Shared checklist (`03-implementation-checklist.md`), sections 1, 2, 3 and 6.
2. Scenarios (`02-behavioral-specifications.md` output) for the backend-surface and API-level rows.
3. Intent diagram (Phase 2), for states, transitions and guards.
4. The repository backend code, schemas, seed data, and existing API tests.

## Execution Rules

1. **Study Before Listing (Mandatory):** Read the routes, handlers, services, validators, schemas, persistence layer, auth middleware, seed data and existing API tests in the affected area. Cite the files you read.
2. **Contract Is Authoritative:** Implement the request, response, status and error shapes from the checklist's API contract matrix. Do not change them to fit an implementation convenience; a conflict goes to Phase 6.
3. **Existing Endpoints:** Record the current behavior as a regression baseline by executing the endpoint against the local server (passthrough, per `07-dynamic-api-response.md`). The baseline is for drift detection only; it is never an expectation for new behavior.
4. **New Endpoints:** Do not execute or capture them. List the intended contract and mark `Baseline: deferred`.
5. **Possible Cases (Mandatory):** For each endpoint and each state change, list the cases the server must handle: missing or malformed fields, each boundary value in the spec, each role's permission, unauthenticated requests, duplicate or repeated requests, concurrent updates, not-found resources, and dependencies that fail. Each case is either:
   - mapped to a `SCN-*` (or a new scenario, raised for Phase 6), or
   - raised as an `AMB-*` if the spec does not state the expected result.
     Never invent status codes, limits or messages to fill a case.
6. **Business Rules Live in the Domain Layer:** Validation and invariants from Phase 1 belong in domain or service code, not in route handlers.
7. **Locally Seedable Data:** Note which seed data or fixtures each task needs, so that tests can run against deterministic data.
8. **Checklist Traceability:** Every item cites the checklist item it implements. Every checklist backend item has at least one task.

## Output Format

### 1. Files Studied

| File     | Why it matters            |
| :------- | :------------------------ |
| `[path]` | `[pattern or constraint]` |

### 2. Endpoint Baseline Status

| Endpoint          | Exists? | Baseline                                                | Notes                    |
| :---------------- | :------ | :------------------------------------------------------ | :----------------------- |
| `/api/[resource]` | Yes     | `tests/testdata/api/[feature]/[resource].baseline.json` | Captured via passthrough |
| `/api/[new]`      | No      | deferred                                                | Contract from checklist  |

### 3. Task List

| ID       | Checklist Ref      | Action                | Target File | Existing / New | Pattern To Follow               | Change Detail                             | Scenario(s)         |
| :------- | :----------------- | :-------------------- | :---------- | :------------- | :------------------------------ | :---------------------------------------- | :------------------ |
| `BE-001` | `[checklist item]` | Add / Update / Verify | `[path]`    | existing       | `[file that shows the pattern]` | `[what changes, in implementation terms]` | `SCN-[feature]-001` |

### 4. Case Matrix

| Endpoint / Operation   | Case                            | Expected Handling (from spec)               | Scenario / AMB                            | Status                       |
| :--------------------- | :------------------------------ | :------------------------------------------ | :---------------------------------------- | :--------------------------- |
| `POST /api/[resource]` | `[e.g. quantity above maximum]` | `[status and error envelope from the spec]` | `SCN-[feature]-003` / `AMB-[feature]-004` | Mapped / Candidate / Blocked |

Cases marked **Candidate** are not tests. They become tests only after Phase 6 maps them to a scenario.

### 5. Seed and Data Needs

- `[seed dataset, roles, and reset strategy needed by each task]`

### 6. Conflicts for Phase 6

- `[shared contract or scope conflict, with the frontend concern if known]`

### 7. Coverage Against Checklist

- Checklist backend items covered: `[n/n]`
- Scenarios with a backend task: `[n/n]`
