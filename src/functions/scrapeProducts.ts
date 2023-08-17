import { PrismaClient, Product } from "@prisma/client";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { ProductBase, SeriesBase } from "src/types/prismaTypes";

const prisma = new PrismaClient();
const numThreads = 4;

async function startWorkers(seriesArr: SeriesBase[]): Promise<ProductBase[]> {
  const workerPromises: Promise<ProductBase[]>[] = [];
  
  for (const series of seriesArr) {
    console.time("scrapeProducts");
    const workerPromise = new Promise<ProductBase[]>((resolve, reject) => {
      const worker = new Worker("./src/workers/products_worker.js", {
        workerData: {
          series: series,
        },
      });

      worker.on("message", (workerProducts: ProductBase[]) => {
        resolve(workerProducts);
      });

      worker.on("error", (error) => {
        console.error(`Worker error: ${error}`);
        reject(error);
      });

      worker.on("exit", () => {
        prisma.$disconnect();
      });
    });
    
    console.timeEnd("scrapeProducts");
    workerPromises.push(workerPromise);
  };
  return Promise.all(workerPromises).then(res => res.flat())
};

function seriesBatch(series: SeriesBase[]): SeriesBase[][] {
  console.log('============================================');
  console.time("BULK_PARTITION");
  const batchSize = series.length / numThreads;
  const totalSeries = series.length;
  const batchedSeries: SeriesBase[][] = [];
  
  for (let i = 0; i < totalSeries; i += batchSize) {
    const batch = series.slice(i, i + batchSize);
    batchedSeries.push(batch);
  }

  console.timeEnd('BULK_PARTITION');
  console.log('============================================');
  return batchedSeries;
};

export async function scrapeProducts(seriesArr: SeriesBase[]): Promise<ProductBase[]> {
  const products: ProductBase[] = [];
  const workerPromises: Promise<ProductBase[]>[] = [];
  const seriesBatches = seriesBatch(seriesArr);

  try {
    if (isMainThread) {
      for (let i = 0; i < seriesBatches.length; i++) {
        workerPromises.push(startWorkers(seriesBatches[i]));
      }
      const response = await Promise.all(workerPromises);
      products.push(...response.flat());
      prisma.$disconnect();
    }
  } catch (err) {
    console.error("ERROR FOUND AT scrapeProducts(): ", err);
  }

  return products;
}