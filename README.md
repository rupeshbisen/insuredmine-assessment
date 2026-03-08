# InsuredMine Assessment (Fastify + TypeScript)

## Features
- Upload CSV/XLSX policy data into MongoDB using **Worker Threads**.
- Search policy information by username.
- Aggregate policy count and details by each user.
- Separate MongoDB collections: `Agent`, `User`, `UserAccount`, `Lob`, `Carrier`, `Policy`.
- Real-time CPU monitoring with automatic server worker restart if usage crosses 70%.
- Scheduled post-service: stores a message in DB at specified day and time.

## Prerequisites
- Node.js 20+
- MongoDB Atlas or local MongoDB

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build project:
   ```bash
   npm run build
   ```
4. Run in development:
   ```bash
   npm run dev
   ```
5. Run in production mode:
   ```bash
   npm start
   ```

## Environment
Example `.env`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
PORT=3000
DEFAULT_UPLOAD_PATH=C:\\Users\\rupes\\Downloads\\data-sheet - Node js Assesment (2) (1).csv
CPU_THRESHOLD_PERCENT=70
CPU_CHECK_INTERVAL_MS=5000
```

## API Endpoints

### 1) Upload API (Worker Thread)
`POST /api/upload`

- Option A: multipart form-data with `file` field (`.csv`, `.xlsx`, `.xls`)
- Option B: JSON body with `filePath`

Example JSON body:
```json
{
  "filePath": "C:\\Users\\rupes\\Downloads\\data-sheet - Node js Assesment (2) (1).csv"
}
```

Success response includes import summary:
```json
{
   "message": "Import completed",
   "summary": {
      "totalRows": 1198,
      "agents": 1,
      "users": 100,
      "accounts": 100,
      "lobs": 8,
      "carriers": 15,
      "policies": 1198
   }
}
```

### 2) Search Policy by Username
`GET /api/policies/search?username=Lura`

### 3) Aggregate Policies by User
`GET /api/policies/aggregate-by-user`

### 4) Schedule Message Service
`POST /api/messages/schedule`

Body:
```json
{
  "message": "Reminder message",
  "day": "2026-03-10",
  "time": "14:30"
}
```

The scheduler checks due items periodically and inserts the message into the `Message` collection at the scheduled time.

## Postman Test Order
1. `GET /health`
2. `POST /api/upload`
3. `GET /api/policies/search?username=<firstName>`
4. `GET /api/policies/aggregate-by-user`
5. `POST /api/messages/schedule`
