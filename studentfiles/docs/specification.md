# Specification: One Thousand Checkboxes

## Overview

A real-time collaborative checkbox application where multiple users can toggle 1,000 checkboxes simultaneously. All users see the same shared state, with changes propagating in real-time.

---

## Section 1: Static UI

### Functional Requirements

| ID | Requirement |
|----|-------------|
| S1-F01 | Render exactly 1,000 checkboxes on the page |
| S1-F02 | Arrange checkboxes in a grid layout of 40 columns × 25 rows |
| S1-F03 | Each checkbox must have a unique identifier (0-999) |
| S1-F04 | Display checkbox state (checked/unchecked) based on data from storage |

### Visual/Style Requirements

| ID | Requirement |
|----|-------------|
| S1-V01 | Checkbox size: 20×20 pixels (minimum touch target: 24×24 pixels with padding) |
| S1-V02 | Grid spacing: 4px gap between checkboxes |
| S1-V03 | Unchecked state: white/light background with visible border |
| S1-V04 | Checked state: filled with primary accent color (suggest: #2563eb blue) |
| S1-V05 | Grid container centered horizontally with max-width of 1000px |
| S1-V06 | Subtle hover effect on interactive checkboxes (e.g., slight background tint) |

### Responsive Behavior

| ID | Requirement |
|----|-------------|
| S1-R01 | Desktop (≥1024px): 40 columns × 25 rows |
| S1-R02 | Tablet (768px-1023px): 32 columns × 32 rows (with scroll for remaining 8) |
| S1-R03 | Mobile (<768px): 20 columns × 50 rows, horizontally scrollable if needed |
| S1-R04 | Maintain minimum touch target size (24×24px) at all breakpoints |

### Accessibility Requirements

| ID | Requirement |
|----|-------------|
| S1-A01 | Each checkbox must have an accessible name (e.g., "Checkbox 42") |
| S1-A02 | Use semantic HTML `<input type="checkbox">` or appropriate ARIA role |
| S1-A03 | Support keyboard navigation through grid using arrow keys |
| S1-A04 | Visible focus indicator meeting WCAG 2.1 AA contrast requirements |
| S1-A05 | Grid must be announced as a group to screen readers |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| S1-P01 | Initial render of all 1,000 checkboxes: < 100ms (after data received) |
| S1-P02 | Time to First Contentful Paint: < 1.5 seconds |
| S1-P03 | DOM node count for checkbox grid: ≤ 3,000 nodes |

### Acceptance Criteria

- [ ] Page displays exactly 1,000 checkboxes in a 40×25 grid on desktop
- [ ] Each checkbox shows correct initial state from storage
- [ ] Grid is visually centered and properly spaced
- [ ] Tab and arrow key navigation works through grid
- [ ] Screen reader announces checkbox states correctly
- [ ] Page renders without layout shift after initial paint
- [ ] Lighthouse accessibility score ≥ 90

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| RenderGrid_OnPageLoad_DisplaysExactly1000Checkboxes | Acceptance: Page displays exactly 1,000 checkboxes in a 40×25 grid on desktop | Page displays exactly 1,000 checkboxes in a 40×25 grid on desktop |
| RenderGrid_WithStorageData_DisplaysCorrectInitialState | Acceptance: Each checkbox shows correct initial state from storage | Each checkbox shows correct initial state from storage |
| RenderGrid_OnDesktop_IsCenteredAndSpaced | Acceptance: Grid is visually centered and properly spaced | Grid is visually centered and properly spaced |
| Accessibility_TabNavigation_WorksAcrossGrid | Acceptance: Tab and arrow key navigation works through grid | Tab and arrow key navigation works through grid |
| Accessibility_ArrowKeyNavigation_WorksAcrossGrid | S1-A03: Support keyboard navigation through grid using arrow keys | Tab and arrow key navigation works through grid |
| Accessibility_ScreenReader_AnnouncesCheckboxStates | Acceptance: Screen reader announces checkbox states correctly | Screen reader announces checkbox states correctly |
| RenderGrid_InitialPaint_HasNoLayoutShift | Acceptance: Page renders without layout shift after initial paint | Page renders without layout shift after initial paint |
| Accessibility_LighthouseScore_IsAtLeast90 | Acceptance: Lighthouse accessibility score ≥ 90 | Lighthouse accessibility score ≥ 90 |
| RenderGrid_CheckboxTarget_MeetsSizeRequirement | S1-V01: Checkbox size and touch target | Checkbox size is 20×20 pixels and minimum touch target is 24×24 pixels |
| Performance_InitialRender_CompletesUnder100ms | S1-P01: Initial render of all 1,000 checkboxes | Initial render of all 1,000 checkboxes is < 100ms (after data received) |
| **Negative Tests** | | |
| RenderGrid_WithDuplicateIds_RejectsInvalidSet | S1-F03: Unique identifier (0-999) | Dataset with duplicate identifiers is rejected and does not render as valid grid state |
| RenderGrid_WithOutOfRangeIds_RejectsInvalidSet | S1-F03: Unique identifier (0-999) | Dataset with identifier outside 0-999 is rejected and does not render as valid grid state |
| RenderGrid_WithNonBooleanState_RejectsInvalidState | S1-F04: Display checkbox state based on data from storage | Non-boolean IsChecked values are rejected and are not silently coerced |
| RenderGrid_WithMissingStorageState_RejectsIncompleteState | S1-F04: Display checkbox state based on data from storage | Incomplete storage state is treated as an error and is not silently accepted |

---

## Section 2: Interactive UI

### Functional Requirements

| ID | Requirement |
|----|-------------|
| S2-F01 | Clicking a checkbox toggles its visual state immediately (optimistic update) |
| S2-F02 | Maintain in-memory state of all 1,000 checkboxes |
| S2-F03 | Track ETag for each checkbox to support optimistic concurrency |
| S2-F04 | Queue toggle requests when offline or during network issues |
| S2-F05 | Display connection status indicator (connected/disconnected/reconnecting) |

### Visual/Style Requirements

| ID | Requirement |
|----|-------------|
| S2-V01 | Toggle state change must appear within 16ms of user input (single frame) |
| S2-V02 | Show subtle "pending" indicator while awaiting server confirmation |
| S2-V03 | Animate state change with brief transition (≤150ms) |
| S2-V04 | On conflict/rollback, animate reversion to server state |
| S2-V05 | Connection status indicator: green (connected), yellow (reconnecting), red (disconnected) |

### Accessibility Requirements

| ID | Requirement |
|----|-------------|
| S2-A01 | Spacebar and Enter keys toggle focused checkbox |
| S2-A02 | Focus state clearly visible (distinct from hover) |
| S2-A03 | State changes announced to screen readers (aria-live or native announcement) |
| S2-A04 | Connection status changes announced to screen readers |
| S2-A05 | Disabled state (if applicable) must be conveyed to assistive technology |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| S2-P01 | Visual feedback latency from click to state change: < 16ms |
| S2-P02 | Memory footprint for 1,000 checkbox states: < 500KB |
| S2-P03 | State update propagation to UI: < 1ms |

### Acceptance Criteria

- [ ] Clicking any checkbox immediately toggles its visual state
- [ ] Keyboard toggle (Space/Enter) works on focused checkbox
- [ ] In-memory state reflects all toggles before server sync
- [ ] Connection indicator shows correct status
- [ ] Screen reader announces "checked" or "unchecked" on toggle
- [ ] No perceptible delay between click and visual change

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| Toggle_OnClick_ImmediatelyUpdatesVisualState | Acceptance: Clicking any checkbox immediately toggles its visual state | Clicking any checkbox immediately toggles its visual state |
| Toggle_OnKeyboard_SpaceAndEnterSupported | Acceptance: Keyboard toggle (Space/Enter) works on focused checkbox | Keyboard toggle (Space/Enter) works on focused checkbox |
| Toggle_OnUserAction_UpdatesInMemoryBeforeSync | Acceptance: In-memory state reflects all toggles before server sync | In-memory state reflects all toggles before server sync |
| ConnectionStatus_DisplaysConnectedReconnectingDisconnected | Acceptance: Connection indicator shows correct status | Connection indicator shows correct status |
| Accessibility_Toggle_AnnouncesCheckedUnchecked | Acceptance: Screen reader announces "checked" or "unchecked" on toggle | Screen reader announces "checked" or "unchecked" on toggle |
| Toggle_OnUserInput_HasNoPerceptibleDelay | Acceptance: No perceptible delay between click and visual change | No perceptible delay between click and visual change |
| Toggle_VisualFeedback_Under16ms | S2-V01 and S2-P01: visual feedback latency target | Toggle state change appears within 16ms of user input |
| Toggle_Offline_QueuesRequest | S2-F04: Queue toggle requests when offline or during network issues | Toggle requests are queued when offline or during network issues |
| **Negative Tests** | | |
| Toggle_WithInvalidCheckboxIndex_RejectsAction | S2-F02: Maintain in-memory state of all 1,000 checkboxes | Toggle with index outside 0-999 is rejected and does not mutate in-memory state |
| Toggle_WithMissingETag_RejectsOptimisticUpdate | S2-F03: Track ETag for each checkbox | Toggle without tracked ETag is rejected and is not silently persisted |
| ConnectionStatus_WithUnknownValue_RejectsInvalidState | S2-F05: Display connection status indicator | Unknown connection status value is rejected and not silently mapped |
| Toggle_WithMissingStateStore_RejectsOperation | S2-F02: Maintain in-memory state of all 1,000 checkboxes | Toggle operation fails fast when state store is uninitialized |

---

## Section 3: Storage Layer

### Functional Requirements

| ID | Requirement |
|----|-------------|
| S3-F01 | Store checkbox state in Azure Table Storage |
| S3-F02 | Use single partition with PartitionKey = `"checkboxes"` |
| S3-F03 | Store each checkbox as individual entity with RowKey = `"0"` through `"999"` |
| S3-F04 | Entity schema: `PartitionKey`, `RowKey`, `IsChecked` (bool), system `Timestamp`, system `ETag` |
| S3-F05 | Support Azurite emulator for local development (`UseDevelopmentStorage=true`) |
| S3-F06 | Initialize all 1,000 checkbox entities on first run if table is empty |

### Concurrency Requirements

| ID | Requirement |
|----|-------------|
| S3-C01 | Use ETag-based optimistic concurrency for all updates |
| S3-C02 | All update operations must include `If-Match` header with current ETag |
| S3-C03 | Return HTTP 412 (Precondition Failed) on ETag mismatch |
| S3-C04 | Support ~1,000 concurrent users with independent checkbox updates |
| S3-C05 | Target < 10% ETag conflict rate under normal load |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| S3-P01 | Batch read of all 1,000 entities: < 500ms (P95) |
| S3-P02 | Single entity read: < 50ms (P95) |
| S3-P03 | Single entity write: < 100ms (P95) |
| S3-P04 | Stay within single partition throughput limit: 2,000 entities/sec |
| S3-P05 | Initial table seeding (1,000 entities): < 30 seconds using batch operations |

### Configuration Requirements

| ID | Requirement |
|----|-------------|
| S3-G01 | Connection string configurable via `AzureStorage:ConnectionString` setting |
| S3-G02 | Table name configurable via `AzureStorage:TableName` (default: `"checkboxes"`) |
| S3-G03 | Support both local Azurite and production Azure Table Storage without code changes |

### Acceptance Criteria

- [x] Application connects to Azurite when configured for local development
- [x] Application connects to Azure Table Storage when production connection string provided
- [x] All 1,000 checkbox entities created on first startup
- [x] Reading all checkboxes returns exactly 1,000 entities
- [x] Concurrent updates to different checkboxes succeed without conflict
- [x] Concurrent updates to same checkbox result in one 412 response
- [x] ETag returned from write operations differs from input ETag

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| Storage_Connect_ToAzurite_WithDevConnectionString | Acceptance: Application connects to Azurite when configured for local development | Application connects to Azurite when configured for local development |
| Storage_Connect_ToAzure_WithProductionConnectionString | Acceptance: Application connects to Azure Table Storage when production connection string provided | Application connects to Azure Table Storage when production connection string provided |
| Storage_Startup_InitializesAllEntitiesWhenTableEmpty | Acceptance: All 1,000 checkbox entities created on first startup | All 1,000 checkbox entities are created on first startup |
| Storage_ReadAll_ReturnsExactly1000Entities | Acceptance: Reading all checkboxes returns exactly 1,000 entities | Reading all checkboxes returns exactly 1,000 entities |
| Storage_ConcurrentWrites_DifferentCheckboxes_Succeed | Acceptance: Concurrent updates to different checkboxes succeed without conflict | Concurrent updates to different checkboxes succeed without conflict |
| Storage_ConcurrentWrites_SameCheckbox_ReturnsSingle412 | Acceptance: Concurrent updates to same checkbox result in one 412 response | Concurrent updates to same checkbox result in one 412 response |
| Storage_WriteSuccess_ReturnsDifferentETag | Acceptance: ETag returned from write operations differs from input ETag | ETag returned from write operations differs from input ETag |
| Storage_Update_WithIfMatchCurrentETag_Succeeds | S3-C01 and S3-C02: ETag-based optimistic concurrency with If-Match | Update operation with current ETag in If-Match succeeds |
| Storage_Update_WithStaleETag_Returns412 | S3-C03: Return HTTP 412 on ETag mismatch | Update operation with stale ETag returns HTTP 412 (Precondition Failed) |
| Storage_ReadAll_P95Under500ms | S3-P01: Batch read of all 1,000 entities: < 500ms (P95) | Batch read of all 1,000 entities is < 500ms (P95) |
| Storage_WriteSingle_P95Under100ms | S3-P03: Single entity write: < 100ms (P95) | Single entity write is < 100ms (P95) |
| **Negative Tests (Required Error Handling)** | | |
| Storage_ReadAll_WhenEmpty_ThrowsError | S3-F06 and explicit storage error policy | Empty state is treated as an error and is not treated as a valid state |
| Storage_ReadAll_WhenCorrupted_ThrowsError | S3-F04 and explicit storage error policy | Corrupted state is treated as an error and is not treated as a valid state |
| Storage_Update_WithoutIfMatch_RejectsWrite | S3-C02: All update operations must include If-Match header with current ETag | Update operation without If-Match is rejected and not silently accepted |
| Storage_Update_WithMissingEntity_RejectsWrite | S3-F03: Store each checkbox as individual entity with RowKey "0"-"999" | Update to entity outside RowKey range "0"-"999" is rejected |

---

## Section 4: API Layer

### Functional Requirements

| ID | Requirement |
|----|-------------|
| A4-F01 | `GET /api/checkboxes` - Returns all 1,000 checkbox states |
| A4-F02 | `PUT /api/checkboxes/{id}` - Updates a single checkbox state |
| A4-F03 | Checkbox ID must be integer 0-999 |
| A4-F04 | PUT request body: `{ "isChecked": boolean, "etag": string }` |
| A4-F05 | PUT response on success: `{ "isChecked": boolean, "etag": string }` (HTTP 204 or 200) |
| A4-F06 | PUT response includes new ETag in response body or `ETag` header |

### Response Format

| ID | Requirement |
|----|-------------|
| A4-R01 | `GET /api/checkboxes` response: `{ "checkboxes": [{ "id": number, "isChecked": boolean, "etag": string }, ...] }` |
| A4-R02 | All responses use `application/json` content type |
| A4-R03 | Include `Cache-Control: no-cache` header on GET responses |

### Error Handling Requirements

| ID | Requirement |
|----|-------------|
| A4-E01 | HTTP 400 for invalid checkbox ID (non-numeric or out of range) |
| A4-E02 | HTTP 400 for malformed request body |
| A4-E03 | HTTP 404 for checkbox ID that doesn't exist |
| A4-E04 | HTTP 412 (Precondition Failed) for ETag mismatch |
| A4-E05 | HTTP 429 for rate limit exceeded |
| A4-E06 | HTTP 503 for storage unavailable |
| A4-E07 | Error response body: `{ "error": string, "code": string }` |

### Security Requirements

| ID | Requirement |
|----|-------------|
| A4-S01 | Validate checkbox ID is integer 0-999 |
| A4-S02 | Validate `isChecked` is boolean |
| A4-S03 | Validate `etag` is non-empty string |
| A4-S04 | Rate limit: 10 requests/second per client IP for PUT operations |
| A4-S05 | Rate limit: 5 requests/second per client IP for GET all checkboxes |
| A4-S06 | Implement request body size limit: 1KB max |
| A4-S07 | CORS configuration for allowed origins |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| A4-P01 | GET all checkboxes latency: < 600ms (P95) |
| A4-P02 | PUT single checkbox latency: < 150ms (P95) |
| A4-P03 | API supports 1,000 concurrent connections |

### Acceptance Criteria

- [ ] GET /api/checkboxes returns array of 1,000 checkbox objects
- [ ] PUT /api/checkboxes/42 with valid body toggles checkbox 42
- [ ] PUT with mismatched ETag returns 412 with current state
- [ ] PUT with id=1001 returns 400
- [ ] PUT with id=-1 returns 400
- [ ] PUT with missing etag returns 400
- [ ] Exceeding rate limit returns 429
- [ ] API accessible from configured CORS origins

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| API_GetAll_Returns1000CheckboxObjects | Acceptance: GET /api/checkboxes returns array of 1,000 checkbox objects | GET /api/checkboxes returns array of 1,000 checkbox objects |
| API_Put_ValidBody_TogglesCheckbox42 | Acceptance: PUT /api/checkboxes/42 with valid body toggles checkbox 42 | PUT /api/checkboxes/42 with valid body toggles checkbox 42 |
| API_Put_WithMismatchedETag_Returns412WithCurrentState | Acceptance: PUT with mismatched ETag returns 412 with current state | PUT with mismatched ETag returns 412 with current state |
| API_Put_WithId1001_Returns400 | Acceptance: PUT with id=1001 returns 400 | PUT with id=1001 returns 400 |
| API_Put_WithNegativeId_Returns400 | Acceptance: PUT with id=-1 returns 400 | PUT with id=-1 returns 400 |
| API_Put_WithMissingEtag_Returns400 | Acceptance: PUT with missing etag returns 400 | PUT with missing etag returns 400 |
| API_RateLimit_Exceeded_Returns429 | Acceptance: Exceeding rate limit returns 429 | Exceeding rate limit returns 429 |
| API_CORS_AllowsConfiguredOrigins | Acceptance: API accessible from configured CORS origins | API is accessible from configured CORS origins |
| API_GetAll_ResponseShapeMatchesContract | A4-R01: GET response format contract | GET response is { "checkboxes": [{ "id": number, "isChecked": boolean, "etag": string }, ...] } |
| API_Responses_UseApplicationJson | A4-R02: All responses use application/json | All responses use application/json content type |
| API_GetAll_IncludesNoCacheHeader | A4-R03: Include Cache-Control: no-cache on GET responses | GET responses include Cache-Control: no-cache header |
| API_Put_Success_ReturnsIsCheckedAndEtag | A4-F05: PUT success response schema | PUT success response returns { "isChecked": boolean, "etag": string } |
| API_Put_Success_ReturnsNewETag | A4-F06: PUT response includes new ETag | PUT response includes new ETag in response body or ETag header |
| API_GetAll_P95Under600ms | A4-P01: GET latency target | GET all checkboxes latency is < 600ms (P95) |
| API_Put_P95Under150ms | A4-P02: PUT latency target | PUT single checkbox latency is < 150ms (P95) |
| **Negative Tests (Required Error Handling)** | | |
| API_Put_WithNonNumericId_Returns400 | A4-E01: invalid checkbox ID (non-numeric) | PUT with non-numeric checkbox ID returns HTTP 400 |
| API_Put_WithMalformedBody_Returns400 | A4-E02: malformed request body | PUT with malformed request body returns HTTP 400 |
| API_Put_WithMissingResource_Returns404 | A4-E03: checkbox ID that does not exist | PUT for checkbox ID that does not exist returns HTTP 404 |
| API_Put_WithStorageUnavailable_Returns503 | A4-E06: storage unavailable | PUT when storage is unavailable returns HTTP 503 |
| API_ErrorResponses_ContainErrorAndCode | A4-E07: error response body contract | Error response body is { "error": string, "code": string } |
| API_Put_WithNonBooleanIsChecked_Returns400 | A4-S02: validate isChecked is boolean | PUT with non-boolean isChecked is rejected with HTTP 400 |
| API_Put_WithEmptyEtag_Returns400 | A4-S03: validate etag is non-empty string | PUT with empty etag is rejected with HTTP 400 |
| API_Put_WithOversizedBody_Returns400 | A4-S06: request body size limit 1KB max | PUT request body larger than 1KB is rejected |

---

## Section 5: Integration & Sync

### Functional Requirements

| ID | Requirement |
|----|-------------|
| I5-F01 | Establish SignalR WebSocket connection on page load |
| I5-F02 | Receive real-time updates when other users toggle checkboxes |
| I5-F03 | Broadcast toggle events to all connected clients after successful server update |
| I5-F04 | SignalR hub endpoint: `/hubs/checkboxes` |
| I5-F05 | SignalR message format: `{ "id": number, "isChecked": boolean, "etag": string }` |
| I5-F06 | Fall back to long-polling if WebSocket unavailable |
| I5-F07 | Reconnect automatically on connection loss (exponential backoff) |

### Concurrency Requirements

| ID | Requirement |
|----|-------------|
| I5-C01 | Apply optimistic update immediately on user toggle |
| I5-C02 | On HTTP 412 conflict: re-fetch entity, re-apply user intent, retry with new ETag |
| I5-C03 | Maximum retry attempts for conflict resolution: 3 |
| I5-C04 | On max retries exceeded: revert to server state, show user notification |
| I5-C05 | Incoming SignalR updates override local state (server is source of truth) |
| I5-C06 | Ignore SignalR updates for checkboxes with pending local changes (until confirmed) |

### Conflict Resolution UX

| ID | Requirement |
|----|-------------|
| I5-U01 | No user-facing error for automatically resolved conflicts |
| I5-U02 | Show brief toast notification only if conflict cannot be auto-resolved |
| I5-U03 | Toast message: "Another user changed this checkbox. Please try again." |
| I5-U04 | Visual "bounce" animation when checkbox state reverts |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| I5-P01 | SignalR message delivery latency (server to all clients): < 100ms (P95) |
| I5-P02 | Reconnection attempt interval: start at 1s, max 30s (exponential backoff) |
| I5-P03 | Time from user click to other users seeing update: < 500ms (P95) |

### Acceptance Criteria

- [ ] Page establishes SignalR connection on load
- [ ] User A toggles checkbox 42; User B sees update within 500ms
- [ ] On 412 conflict, client automatically retries up to 3 times
- [ ] After 3 failed retries, checkbox reverts and toast appears
- [ ] Connection lost indicator appears when WebSocket disconnects
- [ ] Connection automatically re-establishes after network recovery
- [ ] State syncs correctly after reconnection

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| Sync_OnPageLoad_EstablishesSignalRConnection | Acceptance: Page establishes SignalR connection on load | Page establishes SignalR connection on load |
| Sync_UserAToggle_UserBSeesUpdateUnder500ms | Acceptance: User A toggles checkbox 42; User B sees update within 500ms | User A toggles checkbox 42; User B sees update within 500ms |
| Conflict_On412_AutomaticallyRetriesUpTo3Times | Acceptance: On 412 conflict, client automatically retries up to 3 times | On 412 conflict, client automatically retries up to 3 times |
| Conflict_After3FailedRetries_RevertsAndShowsToast | Acceptance: After 3 failed retries, checkbox reverts and toast appears | After 3 failed retries, checkbox reverts and toast appears |
| Sync_OnWebSocketDisconnect_ShowsConnectionLostIndicator | Acceptance: Connection lost indicator appears when WebSocket disconnects | Connection lost indicator appears when WebSocket disconnects |
| Sync_AfterNetworkRecovery_AutoReconnects | Acceptance: Connection automatically re-establishes after network recovery | Connection automatically re-establishes after network recovery |
| Sync_AfterReconnect_StateIsCorrectlySynchronized | Acceptance: State syncs correctly after reconnection | State syncs correctly after reconnection |
| Sync_MessageFormat_MatchesHubContract | I5-F05: SignalR message format contract | SignalR message format is { "id": number, "isChecked": boolean, "etag": string } |
| Sync_WhenWebSocketUnavailable_UsesLongPollingFallback | I5-F06: Fall back to long-polling if WebSocket unavailable | Client falls back to long-polling if WebSocket is unavailable |
| Sync_DeliveryLatency_P95Under100ms | I5-P01: server-to-client delivery latency target | SignalR message delivery latency (server to all clients) is < 100ms (P95) |
| Sync_ReconnectBackoff_Uses1sTo30sExponentialStrategy | I5-P02: reconnect interval constraints | Reconnection attempt interval starts at 1s and maxes at 30s (exponential backoff) |
| **Negative Tests (Required Error Handling)** | | |
| Conflict_RetryCount_StopsAt3 | I5-C03: Maximum retry attempts for conflict resolution: 3 | Retry attempts stop at 3 and do not continue beyond the maximum |
| Conflict_WhenNotAutoResolvable_ShowsOnlySpecifiedToast | I5-U02 and I5-U03: toast policy and exact message | Client shows brief toast notification only if conflict cannot be auto-resolved, with message: "Another user changed this checkbox. Please try again." |
| Sync_MessageMissingRequiredFields_RejectsUpdate | I5-F05: SignalR message format contract | Message missing id, isChecked, or etag is rejected and does not update state |
| Sync_InvalidPendingState_DoesNotOverrideLocalPendingChange | I5-C06: Ignore SignalR updates for pending local changes | Incoming SignalR update for checkbox with pending local change is ignored until pending change is confirmed |

---

## Cross-Cutting: Observability

### Metrics

| ID | Metric | Type | Description |
|----|--------|------|-------------|
| O-M01 | `checkbox_toggle_total` | Counter | Total checkbox toggles (label: `status` = success/conflict/error) |
| O-M02 | `checkbox_toggle_duration_ms` | Histogram | End-to-end toggle latency (client click to server confirmation) |
| O-M03 | `consecutive_conflict_retries` | Histogram | Number of retries before success (bucket: 0, 1, 2, 3, 3+) |
| O-M04 | `etag_conflict_rate` | Gauge | Percentage of PUT operations resulting in 412 (5-minute window) |
| O-M05 | `signalr_connections_active` | Gauge | Current number of connected SignalR clients |
| O-M06 | `storage_operation_duration_ms` | Histogram | Azure Table Storage operation latency (label: `operation` = read/write/batch) |

### Tracing

| ID | Requirement |
|----|-------------|
| O-T01 | Implement OpenTelemetry tracing with spans for all storage operations |
| O-T02 | Root span for each API request with unique trace ID |
| O-T03 | Child spans for: storage read, storage write, SignalR broadcast |
| O-T04 | Include attributes on storage write spans: `checkbox.id`, `checkbox.etag_provided`, `checkbox.etag_matched`, `checkbox.retry_count` |
| O-T05 | Include attributes on conflict spans: `conflict.previous_etag`, `conflict.server_etag` |
| O-T06 | Propagate trace context through SignalR messages |

### Logging

| ID | Requirement |
|----|-------------|
| O-L01 | Structured JSON logging format |
| O-L02 | Log level INFO for successful operations |
| O-L03 | Log level WARN for ETag conflicts (expected behavior) |
| O-L04 | Log level ERROR for storage failures, connection issues |
| O-L05 | Include correlation ID in all log entries |

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| `etag_conflict_rate` | > 5% | > 10% |
| `storage_operation_duration_ms` P99 | > 200ms | > 500ms |
| `consecutive_conflict_retries` P95 | > 1 | > 2 |
| `signalr_connections_active` | > 800 | > 950 |

### Acceptance Criteria

- [ ] OpenTelemetry traces appear in configured backend (e.g., Jaeger, Azure Monitor)
- [ ] Storage operation spans include checkbox ID and ETag attributes
- [ ] Conflict events logged at WARN level with both ETags
- [ ] Dashboard shows real-time `etag_conflict_rate` metric
- [ ] `consecutive_conflict_retries` histogram populated with retry counts
- [ ] Alert fires when conflict rate exceeds 10% for 5 minutes

### Test Cases

| Test Name | What It Verifies | Expected Outcome |
|-----------|------------------|------------------|
| Tracing_OpenTelemetrySpans_AppearInConfiguredBackend | Acceptance: OpenTelemetry traces appear in configured backend | OpenTelemetry traces appear in configured backend (e.g., Jaeger, Azure Monitor) |
| Tracing_StorageWriteSpan_HasCheckboxAndETagAttributes | Acceptance: Storage operation spans include checkbox ID and ETag attributes | Storage operation spans include checkbox ID and ETag attributes |
| Logging_ConflictEvents_WarnWithBothETags | Acceptance: Conflict events logged at WARN level with both ETags | Conflict events are logged at WARN level with both conflict.previous_etag and conflict.server_etag |
| Metrics_Dashboard_ShowsRealtimeConflictRate | Acceptance: Dashboard shows real-time etag_conflict_rate metric | Dashboard shows real-time etag_conflict_rate metric |
| Metrics_ConsecutiveConflictRetries_HistogramPopulated | Acceptance: consecutive_conflict_retries histogram populated with retry counts | consecutive_conflict_retries histogram is populated with retry counts |
| Alert_ConflictRateAbove10PercentFor5Minutes_Fires | Acceptance: Alert fires when conflict rate exceeds 10% for 5 minutes | Alert fires when conflict rate exceeds 10% for 5 minutes |
| Metrics_ToggleTotal_RecordsSuccessConflictError | O-M01: checkbox_toggle_total labels | checkbox_toggle_total is recorded with status labels success, conflict, and error |
| Metrics_StorageDuration_RecordsReadWriteBatch | O-M06: storage_operation_duration_ms labels | storage_operation_duration_ms is recorded with operation labels read, write, and batch |
| Tracing_StorageReadWriteAndBroadcast_CreateChildSpans | O-T03: child spans for storage read/write and SignalR broadcast | Child spans are created for storage read, storage write, and SignalR broadcast |
| Tracing_SignalR_PropagatesTraceContext | O-T06: trace context propagation through SignalR | Trace context is propagated through SignalR messages |
| Logging_SuccessAndFailures_UseSpecifiedLevels | O-L02, O-L03, O-L04: required log levels | Successful operations log at INFO, ETag conflicts log at WARN, and storage failures log at ERROR |
| Logging_AllEntries_IncludeCorrelationId | O-L05: correlation ID required | All log entries include correlation ID |
| **Negative Tests (Required Error Handling)** | | |
| Metrics_WhenRequiredLabelsMissing_RejectsMetricWrite | O-M01 and O-M06 label requirements | Metrics missing required labels are rejected and not silently recorded |
| Tracing_WhenRequiredAttributesMissing_FailsValidation | O-T04 and O-T05 required attributes | Spans missing required concurrency attributes fail validation and are reported as telemetry errors |
| Logging_WhenStructuredJsonInvalid_FailsValidation | O-L01 structured JSON logging format | Non-JSON log payloads are rejected by log schema validation |
| Alert_WhenWindowShorterThan5Minutes_DoesNotFireCritical | Acceptance: 10% threshold requires 5-minute window | Critical alert does not fire for conflict-rate spikes shorter than 5 minutes |

---

## Appendix A: State Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Checkbox Toggle State Machine                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐    user click     ┌─────────────┐                            │
│   │  IDLE   │ ─────────────────►│  OPTIMISTIC │                            │
│   │         │                   │   UPDATE    │                            │
│   └─────────┘                   └──────┬──────┘                            │
│        ▲                               │                                    │
│        │                               ▼                                    │
│        │                        ┌─────────────┐                            │
│        │                        │   PENDING   │──── PUT /api/checkboxes/{id}│
│        │                        │   SERVER    │                            │
│        │                        └──────┬──────┘                            │
│        │                               │                                    │
│        │         ┌─────────────────────┼─────────────────────┐             │
│        │         │                     │                     │             │
│        │         ▼                     ▼                     ▼             │
│        │   ┌──────────┐         ┌──────────┐          ┌──────────┐        │
│        │   │   200    │         │   412    │          │  ERROR   │        │
│        │   │ SUCCESS  │         │ CONFLICT │          │  (5xx)   │        │
│        │   └────┬─────┘         └────┬─────┘          └────┬─────┘        │
│        │        │                    │                     │              │
│        │        │                    ▼                     │              │
│        │        │             ┌─────────────┐              │              │
│        │        │             │  RE-FETCH   │              │              │
│        │        │             │  & RETRY    │──┐           │              │
│        │        │             └──────┬──────┘  │ retries   │              │
│        │        │                    │         │ < 3       │              │
│        │        │                    │         └───────────┘              │
│        │        │                    ▼                                    │
│        │        │             ┌─────────────┐                             │
│        │        │             │   REVERT    │ (retries ≥ 3)              │
│        │        │             │ SHOW TOAST  │                             │
│        │        │             └──────┬──────┘                             │
│        │        │                    │                                    │
│        └────────┴────────────────────┴────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Appendix B: API Contract Examples

### GET /api/checkboxes

**Request:**
```http
GET /api/checkboxes HTTP/1.1
Host: localhost:5000
Accept: application/json
```

**Response (200 OK):**
```json
{
  "checkboxes": [
    { "id": 0, "isChecked": false, "etag": "W/\"datetime'2024-01-15T10%3A30%3A00Z'\"" },
    { "id": 1, "isChecked": true, "etag": "W/\"datetime'2024-01-15T10%3A31%3A00Z'\"" },
    ...
    { "id": 999, "isChecked": false, "etag": "W/\"datetime'2024-01-15T10%3A30%3A00Z'\"" }
  ]
}
```

### PUT /api/checkboxes/{id}

**Request:**
```http
PUT /api/checkboxes/42 HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Accept: application/json

{
  "isChecked": true,
  "etag": "W/\"datetime'2024-01-15T10%3A30%3A00Z'\""
}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "isChecked": true,
  "etag": "W/\"datetime'2024-01-15T10%3A35%3A00Z'\""
}
```

**Response (412 Precondition Failed):**
```json
{
  "error": "ETag mismatch - checkbox was modified by another user",
  "code": "ETAG_CONFLICT",
  "current": {
    "id": 42,
    "isChecked": false,
    "etag": "W/\"datetime'2024-01-15T10%3A34%3A00Z'\""
  }
}
```

## Appendix C: SignalR Message Contract

### Hub: `/hubs/checkboxes`

**Server-to-Client Message: `CheckboxUpdated`**
```json
{
  "id": 42,
  "isChecked": true,
  "etag": "W/\"datetime'2024-01-15T10%3A35%3A00Z'\"",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**Connection Lifecycle Events:**
- `OnConnected`: Client receives current state snapshot
- `OnDisconnected`: Server cleans up client subscription
- `OnReconnected`: Client receives delta of changes since disconnect (if available) or full state
