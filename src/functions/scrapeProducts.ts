import { PrismaClient, Product } from "@prisma/client";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { ProductBase, SeriesBase } from "src/types/prismaTypes";

const prisma = new PrismaClient();
const numThreads = 2;

async function startWorkers(seriesArr: SeriesBase[]) {
  const workerPromises: Promise<ProductBase[]>[] = [];
  
  for (const series of seriesArr) {
    const workerPromise = new Promise<ProductBase[]>((resolve, reject) => {
      const worker = new Worker("./src/workers/products_worker.js", {
        workerData: {
          series: series,
        },
      });

      worker.on("message", (workerProducts: ProductBase[]) => {
        console.log("src/functions/scrapeProducts.ts: worker resolved")
        resolve(workerProducts);
      });

      worker.on("error", (error) => {
        console.error(`Worker error: ${error}`);
        reject(error);
      });

    });
    workerPromises.push(workerPromise);
  };
  const result = await Promise.all(workerPromises)
  return result.flat();
};

function seriesBatch(series: SeriesBase[]): SeriesBase[][] {
  const batchSize = Math.ceil(series.length / numThreads);
  const totalSeries = series.length;
  const batchedSeries: SeriesBase[][] = [];
  
  for (let i = 0; i < totalSeries; i += batchSize) {
    const batch = series.slice(i, i + batchSize);
    batchedSeries.push(batch);
  }
  return batchedSeries;
};

export async function scrapeProducts(seriesArr: SeriesBase[]): Promise<ProductBase[]> {
  let products: ProductBase[] = [];
  const workerPromises: Promise<ProductBase[]>[] = [];
  const seriesBatches = seriesBatch(seriesArr);

  try {
    if (isMainThread) {
      for (let i = 0; i < seriesBatches.length; i++) {
        const worker = startWorkers(seriesBatches[i])
        workerPromises.push(worker);
      }
      console.time('src/functions/scrapeProducts.ts: AWAIT WORKER PROMISES');
      const response = await Promise.all(workerPromises);
      console.timeEnd('src/functions/scrapeProducts.ts: AWAIT WORKER PROMISES')
      products = response.flat()
      prisma.$disconnect();
    }
  } catch (err) {
    console.error("ERROR FOUND AT scrapeProducts(): ", err);
  }

  return products;
}