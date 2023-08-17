import { parentPort, workerData } from "worker_threads";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function batchUpsert(transactions) {
  console.log('============================================')
  console.time('BEGIN_BATCH_TRANSACTION');

  try {
    await prisma.$transaction(transactions);
  } catch (e) {
    console.error(e);
  }

  console.timeEnd('BEGIN_BATCH_TRANSACTION');
  console.log('============================================');
}

if (parentPort) {
  const transactions = workerData.transactions;

  batchUpsert(transactions).then(() => {
    parentPort.postMessage();
  });
}