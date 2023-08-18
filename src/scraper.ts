import {PrismaClient} from "@prisma/client";
import {scrapeSeries} from "./functions/scrapeSeries";
import {scrapeProducts} from "./functions/scrapeProducts";

const prisma = new PrismaClient();

async function main() {
  try {
    console.time("SCRAPE_SERIES");
    const seriesList = await scrapeSeries();

    for (const series of seriesList) {
      console.time("INSERT_SERIES");
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
        },
      });
      console.timeEnd("INSERT_SERIES");
    }
    console.timeEnd("SCRAPE_SERIES");
    console.log("Completed series scraping");
    console.time("SCRAPE_PRODUCTS");

    const seriesArr = await prisma.series.findMany();
    const products = await scrapeProducts(seriesArr);

    for (const product of products) {
      console.time("INSERT_PRODUCT");
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
      console.timeEnd("INSERT_PRODUCT");
    }
    console.log(products.length);
    console.timeEnd("SCRAPE_PRODUCTS");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("ERROR:", error);
});
