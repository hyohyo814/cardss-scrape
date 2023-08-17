import {PrismaClient} from "@prisma/client";
// import { scrapeSeries } from "./functions/scrapeSeries";
import {scrapeProducts} from "./functions/scrapeProducts";
// import { Worker } from 'worker_threads';

const prisma = new PrismaClient();

async function main() {
  // const series = await scrapeSeries();
  const products = scrapeProducts().then(res => res).catch(error => {
    console.log("Error caught", error);
  });

  // console.log(series);
  console.log(products);
  /*
  for (const series of seriesList) {
    await prisma.series.upsert({
      where: {
        title: series.title,
      },
      update: {
        url: series.url,
      },
      create: {
        title: series.title,
        url: series.url,
      }
    })
  }
  
  console.log('complete title scraping')
  const products = await scrapeProducts();

  products.forEach(async (product) => {
    await prisma.product.upsert({
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
    });
  });
  */
}

main()
  .catch((error) => {
    console.error("ERROR BOOM", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
