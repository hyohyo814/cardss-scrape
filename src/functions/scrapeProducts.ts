import axios from "axios";
import {PrismaClient} from "@prisma/client";
import * as cheerio from "cheerio";
import {Worker, isMainThread, parentPort, workerData} from "worker_threads";

export type User = {
  id: string;
  watchList: Product[];
};

export type Series = {
  id: string;
  title: string;
  url: string;
  products: Product[];
};

export type SeriesBase = Omit<Series, "id" | "products">;

export type Product = {
  id: string;
  series: Series;
  seriesId: string;
  name: string;
  price: string;
  image: string;
  savedBy?: User;
  savedById?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductBase = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "series"
>;

const prisma = new PrismaClient();

export async function scrapeProducts(): Promise<
  Array<ProductBase>
> {
  //const seriesArr = await prisma.series.findMany();
  const seriesArr = [
    {
      url: "https://www.novatcg.com/product-category/weiss-schwarz-japanese/fujimi-fantasia-bunko/",
      title: "Fujimi_Fantasia_Bunko",
    },
    {
      url: "https://www.novatcg.com/product-category/weiss-schwarz-japanese/heavens-feel/",
      title: "Fate_Stay_Night_Movie:_Heaven's_Feel",
    },
    {
      url: "https://www.novatcg.com/product-category/weiss-schwarz-japanese/seishun-buta-yarou-wa-bunny-girl-senpai-no-yume-wo-minai/",
      title: "Seishun_Buta_Yarou_wa_Bunny_Girl_Senpai_no_Yume_wo_Minai",
    },
    {
      url: "https://www.novatcg.com/product-category/weiss-schwarz-japanese/goblin-slayer/",
      title: "Goblin_Slayer",
    },
    {
      url: "https://www.novatcg.com/product-category/weiss-schwarz-japanese/kadokawa-sneaker-bunko/",
      title: "Kadokawa_Sneaker_Bunko",
    },
  ];
  const products = new Array<ProductBase>();
  // console.log(seriesArr);

  if (isMainThread) {
    console.time("scrapeProducts");

    for (const series of seriesArr) {
      const worker = new Worker("./src/workers/products_worker.js", {
        workerData: {
          series: series,
        },
      });

      worker.on("message", (workerProducts: Array<ProductBase>) => {
        products.push(...workerProducts);
        worker.terminate();
      });

      worker.on("error", (error) => {
        console.error(`Worker error: ${error}`);
      });

      worker.on("exit", () => {
        prisma.$disconnect();
      });
    }
  } else {
    const series = workerData.series;
    const {data} = await axios.get(series.url);
    const $ = cheerio.load(data, null, false);
    const shopList = $("div.shop-with-sidebar li");
    const workerProducts = new Array<ProductBase>();

    shopList.each((_idx, el) => {
      const obj = {} as ProductBase;
      const name =
        $(el).find("h2.woocommerce-loop-product__title").text() ?? "no-title";
      const price = $(el).find("span.price").text() ?? "no-price";
      const image = $(el).find("img.wp-post-image").attr("src") ?? "no-image";

      obj.name = name;
      obj.price = price;
      obj.image = image;
      obj.seriesId = series.id;

      workerProducts.push(obj);
    });

    parentPort?.postMessage(workerProducts);
  }

  console.log(products);
  return products;
}
