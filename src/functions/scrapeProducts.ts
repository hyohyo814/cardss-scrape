import { PrismaClient, Product } from "@prisma/client";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { ProductBase, SeriesBase } from "src/types/prismaTypes";

const prisma = new PrismaClient();

export async function scrapeProducts(seriesArr: SeriesBase[]): Promise<ProductBase[]> {
  const products: ProductBase[] = [];
  const workerPromises: Promise<ProductBase[]>[] = [];

  try {
    if (isMainThread) {
      
      for (const series of seriesArr) {
        console.time("scrapeProducts");
        const workerPromise = new Promise<ProductBase[]>((resolve, reject) => {
          const worker = new Worker("./src/workers/products_worker.js", {
            workerData: {
              series: series,
            },
          });

          worker.on("message", (workerProducts: ProductBase[]) => {
            products.push(...workerProducts);
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
        console.log('PRODUCTS LEN: ', products.length);
        workerPromises.push(workerPromise);
      }

      await Promise.all(workerPromises);
      prisma.$disconnect();
    }
  } catch (err) {
    console.error("ERROR FOUND AT scrapeProducts(): ", err);
  }

  return products;
}