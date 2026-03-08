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
- MongoDB running locally or remotely

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
4. Run server:
   ```bash
   npm start
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
