import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs";
import path from "node:path";
import csv from "csv-parser";
import xlsx from "xlsx";
import { connectDb, disconnectDb } from "../db";
import { AgentModel } from "../models/Agent";
import { CarrierModel } from "../models/Carrier";
import { LobModel } from "../models/Lob";
import { PolicyModel } from "../models/Policy";
import { UserAccountModel } from "../models/UserAccount";
import { UserModel } from "../models/User";
import { parseDate } from "../utils/date";
import type { CsvRow } from "../types/csvRow";

type WorkerInput = {
  filePath: string;
  mongoUri: string;
};

type ImportSummary = {
  totalRows: number;
  agents: number;
  users: number;
  accounts: number;
  lobs: number;
  carriers: number;
  policies: number;
};

const input = workerData as WorkerInput;

async function parseCsv(filePath: string): Promise<CsvRow[]> {
  const rows: CsvRow[] = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data as CsvRow))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function parseXlsx(filePath: string): CsvRow[] {
  const workbook = xlsx.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json<CsvRow>(workbook.Sheets[firstSheet], { defval: "" });
}

async function loadRows(filePath: string): Promise<CsvRow[]> {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".csv") {
    return parseCsv(filePath);
  }
  if (extension === ".xlsx" || extension === ".xls") {
    return parseXlsx(filePath);
  }
  throw new Error("Unsupported file format. Upload CSV, XLSX, or XLS.");
}

async function processRows(rows: CsvRow[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalRows: rows.length,
    agents: 0,
    users: 0,
    accounts: 0,
    lobs: 0,
    carriers: 0,
    policies: 0
  };

  const agentCache = new Map<string, string>();
  const userCache = new Map<string, string>();
  const accountCache = new Map<string, string>();
  const lobCache = new Map<string, string>();
  const carrierCache = new Map<string, string>();

  for (const row of rows) {
    if (!row.policy_number || !row.firstname || !row.category_name || !row.company_name || !row.agent) {
      continue;
    }

    let agentId = agentCache.get(row.agent);
    if (!agentId) {
      const agent = await AgentModel.findOneAndUpdate(
        { name: row.agent },
        { $setOnInsert: { name: row.agent } },
        { upsert: true, new: true }
      );
      agentId = String(agent._id);
      agentCache.set(row.agent, agentId);
      summary.agents += 1;
    }

    const userKey = `${row.firstname}|${row.email ?? ""}|${row.phone ?? ""}`;
    let userId = userCache.get(userKey);
    if (!userId) {
      const user = await UserModel.findOneAndUpdate(
        { firstName: row.firstname, email: row.email ?? undefined, phoneNumber: row.phone ?? undefined },
        {
          $set: {
            firstName: row.firstname,
            dob: parseDate(row.dob),
            address: row.address,
            phoneNumber: row.phone,
            state: row.state,
            zipCode: row.zip,
            email: row.email,
            gender: row.gender,
            userType: row.userType,
            agentId
          }
        },
        { upsert: true, new: true }
      );
      userId = String(user._id);
      userCache.set(userKey, userId);
      summary.users += 1;
    }

    if (row.account_name) {
      const accountKey = `${row.account_name}|${userId}`;
      if (!accountCache.has(accountKey)) {
        await UserAccountModel.findOneAndUpdate(
          { accountName: row.account_name, userId },
          { $setOnInsert: { accountName: row.account_name, userId } },
          { upsert: true, new: true }
        );
        accountCache.set(accountKey, "1");
        summary.accounts += 1;
      }
    }

    let lobId = lobCache.get(row.category_name);
    if (!lobId) {
      const lob = await LobModel.findOneAndUpdate(
        { categoryName: row.category_name },
        { $setOnInsert: { categoryName: row.category_name } },
        { upsert: true, new: true }
      );
      lobId = String(lob._id);
      lobCache.set(row.category_name, lobId);
      summary.lobs += 1;
    }

    let carrierId = carrierCache.get(row.company_name);
    if (!carrierId) {
      const carrier = await CarrierModel.findOneAndUpdate(
        { companyName: row.company_name },
        { $setOnInsert: { companyName: row.company_name } },
        { upsert: true, new: true }
      );
      carrierId = String(carrier._id);
      carrierCache.set(row.company_name, carrierId);
      summary.carriers += 1;
    }

    await PolicyModel.findOneAndUpdate(
      { policyNumber: row.policy_number },
      {
        $set: {
          policyNumber: row.policy_number,
          policyStartDate: parseDate(row.policy_start_date),
          policyEndDate: parseDate(row.policy_end_date),
          policyCategoryCollectionId: lobId,
          companyCollectionId: carrierId,
          userId
        }
      },
      { upsert: true, new: true }
    );
    summary.policies += 1;
  }

  return summary;
}

async function run(): Promise<void> {
  await connectDb(input.mongoUri);
  try {
    const rows = await loadRows(input.filePath);
    const summary = await processRows(rows);
    parentPort?.postMessage({ success: true, summary });
  } finally {
    await disconnectDb();
  }
}

run().catch((error) => {
  parentPort?.postMessage({ success: false, error: error instanceof Error ? error.message : "Worker failed" });
});
