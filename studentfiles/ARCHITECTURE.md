# Architecture: One Thousand Checkboxes

## Overview

A real-time collaborative checkbox application where multiple users can toggle 1,000 checkboxes simultaneously. All users see the same shared state, with changes propagating in real-time. The architecture prioritizes low-latency updates and graceful handling of concurrent modifications.

## System Components

### Frontend

The frontend is an optimized web client designed for real-time collaboration:
- **State Management**: Maintains an in-memory representation of all 1,000 checkboxes, tracking both the `isChecked` status and `etag` for each.
- **Optimistic UI**: User toggles immediately update the visual state (< 16ms latency) and show a pending indicator before awaiting server confirmation.
- **Offline & Queueing Support**: Intelligently queues toggle requests when the user goes offline or during network interruptions, processing them transparently once the connection recovers. 
- **Real-Time Sync**: Uses a persistent SignalR connection to instantly reflect changes made by other users.
- **Conflict Handling**: Intercepts HTTP 412 sequence conflicts, refetches state, and automatically reverts or retries to stay in sync.
- **Rendering**: Implements a responsive CSS Grid (40×25 on desktop) optimized to keep DOM node count low (≤ 3,000) while supporting full keyboard navigation and screen readers (`aria-live` regions and specific status indicators).

### API Layer

Built on Express (Node.js), the API coordinates state between the storage layer and connected clients:
- **REST Endpoints**:
  - `GET /api/checkboxes`: Reads and returns the complete state of all 1,000 checkboxes. Includes `Cache-Control: no-cache` to ensure clients retrieve fresh data.
  - `PUT /api/checkboxes/{id}`: Processes individual toggle requests, enforcing optimistic concurrency strictly via `etag` in the request body.
- **Real-Time Hub** (`/hubs/checkboxes`): A SignalR Hub that broadcasts `CheckboxUpdated` events to all connected clients immediately after a successful PUT operation.
- **Middleware**:
  - **Rate Limiting**: Protects backend capacity (10 req/sec for PUTs, 5 req/sec for GETs per IP).
  - **Input/Security Validation**: Implements CORS defaults, rejects invalid IDs (out of 0-999 range), malformed ETags, and oversized request bodies (>1KB).
  - **Observability**: Injects OpenTelemetry distributed tracing to monitor `etag_conflict_rate` and track end-to-end component latency.

### Data Layer

**Storage Solution:** Azure Table Storage

Each checkbox is stored as an individual entity:

| Property | Value | Description |
|----------|-------|-------------|
| `PartitionKey` | `"checkboxes"` | Single partition for all checkboxes |
| `RowKey` | `"0"` - `"999"` | Checkbox index as string |
| `IsChecked` | `bool` | Current checkbox state |
| `Timestamp` | `DateTimeOffset` | System-managed last modified time |
| `ETag` | `string` | System-managed version identifier |

**Why not a packed bitmap in Blob Storage?**

A bitmap approach (1000 checkboxes = 125 bytes in one blob) creates a contention bottleneck. With ETag-based optimistic concurrency, two users toggling *different* checkboxes still conflict because they modify the same blob. Analysis shows this limits concurrent users to ~2 before retry storms degrade UX.

With Table Storage, each checkbox has its own ETag—users only conflict when toggling the *same* checkbox, supporting ~1000 concurrent users.

## Data Flow

### Read: Get All Checkboxes

```
Client → GET /api/checkboxes → Query Table (PartitionKey = "checkboxes") → Return all 1000 entities
```

### Write: Toggle a Checkbox (Optimistic Concurrency)

```
1. Client sends: PUT /api/checkboxes/{id} with { isChecked: true, etag: "original-etag" }

2. Server executes conditional update:
   - Check ETag provided in request matches current ETag in Storage
   - Replace entity with new IsChecked value

3. Outcomes:
   - HTTP 200: Success (entity updated, newly generated ETag and `isChecked` returned securely)
   - HTTP 400: Invalid Request Body / ID
   - HTTP 412: Conflict (another user modified this checkbox)
   - HTTP 404: Checkbox doesn't exist
   - HTTP 429: Rate Limit Exceeded
   - HTTP 503: Storage Unavailable
```

### Conflict Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ User A: Toggle checkbox #42          User B: Toggle checkbox #42            │
├─────────────────────────────────────────────────────────────────────────────┤
│ T1: Read entity #42 (ETag: "abc")    T2: Read entity #42 (ETag: "abc")     │
│ T3: Update with ETag "abc" ───────────────────────────────► SUCCESS        │
│     New ETag: "def"                                                         │
│                                      T4: Update with ETag "abc" ──────► 412 │
│                                      T5: Re-read entity #42 (ETag: "def")  │
│                                      T6: Update with ETag "def" ────► SUCCESS│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Point:** On HTTP 412, the client should:
1. Re-fetch the current state (gets latest ETag)
2. Re-apply the user's intended action
3. Retry the update with the new ETag

### Real-Time Updates (SignalR)

```
┌──────────┐    WebSocket     ┌──────────┐     Broadcast      ┌──────────┐
│ Client A │ ───────────────► │  SignalR │ ◄───────────────── │ Client B │
│          │ ◄─────────────── │   Hub    │ ──────────────────►│          │
└──────────┘  "checkbox:42"   └──────────┘   "checkbox:42"    └──────────┘
              toggled                        toggled
```

After a successful write, the server broadcasts the change to all connected clients so they update their UI without polling.

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Storage** | Azure Table Storage | Per-entity ETags enable fine-grained optimistic concurrency; supports ~1000 concurrent users; low cost; full Azurite support |
| **Concurrency** | ETag + If-Match | Optimistic locking prevents lost updates without expensive distributed locks |
| **Real-time** | SignalR | WebSocket-based push for instant updates; automatic fallback to long-polling |
| **Backend** | Express (Node.js) | Native Azure SDK support; SignalR integration; high performance |
| **Local Emulator** | Azurite | Full Table Storage API compatibility; no Azure subscription needed for development |

### Why Azure Table Storage Over Alternatives?

| Approach | Max Concurrent Users | Conflict Scope |
|----------|---------------------|----------------|
| Blob Storage (bitmap) | ~2 | Entire blob |
| **Table Storage** | **~1000** | **Single checkbox** |
| Cosmos DB | ~2000 | Single document |

Cosmos DB offers higher capacity but requires minimum 400 RU/s (~$24/month). Table Storage is effectively free at this scale and sufficient for the use case.

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (>=18.0)
- [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) (Azure Storage Emulator)

### Install and Run Azurite

**Option 1: npm (recommended)**
```bash
npm install -g azurite
azurite --silent --location ./azurite-data --debug ./azurite-debug.log
```

**Option 2: VS Code Extension**
Install "Azurite" extension, then run "Azurite: Start" from command palette.

**Option 3: Docker**
```bash
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite
```

### Default Azurite Endpoints

| Service | Port | Endpoint |
|---------|------|----------|
| Blob | 10000 | `http://127.0.0.1:10000/devstoreaccount1` |
| Queue | 10001 | `http://127.0.0.1:10001/devstoreaccount1` |
| **Table** | **10002** | `http://127.0.0.1:10002/devstoreaccount1` |

### Connection String for Local Development

```
UseDevelopmentStorage=true
```

Or explicitly:
```
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;
```

### Environment Configuration

Use `.env` for configuration:
```env
AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true"
```

## Service Limits

### Azure Table Storage Limits (from Microsoft Learn)

| Resource | Limit | Notes |
|----------|-------|-------|
| Max entity size | 1 MiB | Our checkbox entity is ~100 bytes |
| Max properties per entity | 255 | We use 2 custom properties |
| PartitionKey/RowKey size | 1024 chars | We use max 10 chars |
| Single partition throughput | 2,000 entities/sec | Sufficient for ~1000 users at 1 toggle/sec |
| Account throughput | 20,000 transactions/sec | Well above our needs |
| Entity Group Transaction | 100 entities, 4 MiB | For bulk initialization |

### Operational Limits to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| `etag_conflict_rate` | 5% | 10% |
| Write latency P99 | 200ms | 500ms |
| Retries per operation P95 | 1 | 2 |

### Scaling Considerations

At ~1000 concurrent users (1 toggle/user/sec), expect:
- ~10% of writes to encounter ETag conflicts (single retry)
- <1% of writes to require 2+ retries

If user count exceeds 1000, consider:
1. **Partition sharding**: Split checkboxes across multiple PartitionKeys (e.g., `"checkboxes-0"` through `"checkboxes-9"`)
2. **Rate limiting**: Throttle toggles per user to reduce write frequency
3. **Migration to Cosmos DB**: Higher cost but supports ~2000+ concurrent users
