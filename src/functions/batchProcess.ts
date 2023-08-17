import { Worker, isMainThread, parentPort, workerData  } from "worker_threads";
import { ProductBase, SeriesBase } from "src/types/prismaTypes";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const numThreads = 2;

interface Upsert {
  where: {
    name: string
  }
  update: {
    price: string
  }
  create: {
    name: string
    price: string
    image: string
    seriesId: string
  }
}

function upsertBatch(products: ProductBase[]): Upsert[] {
  const upsertManyData = products.map(product => ({
    where: {
      name: product.name,
    },
    update: {
      price: product.price,
    },
    create: {
      name: product.name,
      price: product.price,
      image: product.image,
      seriesId: product.seriesId,
    },
  }));

  return upsertManyData;
};

function productsBatch(products: ProductBase[]): Upsert[][] {
  console.log('============================================');
  console.time("BULK_PARTITION");
  const batchSize = products.length / numThreads;
  const totalProducts = products.length;
  const productBatch: Upsert[][] = [];
  
  for (let i = 0; i < totalProducts; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    productBatch.push(upsertBatch(batch));
  };

  console.timeEnd('BULK_PARTITION');
  console.log('============================================');
  return productBatch;
};

async function startWorkers(transactionArr: Upsert[]) {
  const workerPromises: Promise<void>[] = [];
  
  for (const transactions of transactionArr) {
    console.time("upsertData");
    const workerPromise = new Promise<void>((resolve, reject) => {
      const worker = new Worker("./src/workers/upsert_worker.js", {
        workerData: {
          transactions: transactions
        },
      });

      worker.on("message", () => {
        resolve();
      });

      worker.on("error", (error) => {
        console.error(`Worker error: ${error}`);
        reject(error);
      });

      worker.on("exit", () => {
        prisma.$disconnect();
      });
    });
    console.timeEnd("upsertData");
    workerPromises.push(workerPromise);
  };
  await Promise.all(workerPromises);
};

export async function batchUpsert(products: ProductBase[]) {
  const workerPromises: Promise<void>[] = [];
  const productBatches = productsBatch(products);

  try {
    if (isMainThread) {
      for (let i = 0; i < productBatches.length; i++) {
        workerPromises.push(startWorkers(productBatches[i]));
      };
      await Promise.all(workerPromises);
      prisma.$disconnect();
    }
  } catch (err) {
    console.error("ERROR FOUND AT scrapeProducts(): ", err);
  }
}
