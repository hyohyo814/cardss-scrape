import axios from "axios";
import {SeriesBase} from "../types/prismaTypes";
import * as cheerio from "cheerio";

// const prisma = new PrismaClient();

export async function scrapeSeries(): Promise<Array<SeriesBase>> {
  const url = "https://www.novatcg.com/product-category/weiss-schwarz-japanese";
  const {data} = await axios.get(url);

  const $ = cheerio.load(data, null, false);
  const series = $(".products li");
  const seriesList = new Array<SeriesBase>();

  series.each((index, el) => {
    const obj = {} as SeriesBase;
    const urlParse = $(el).find("a").attr("href");
    const titleParse = $(el)
      .find(".woocommerce-loop-category__title")
      .text()
      .trim();

    if (!urlParse) {
      console.log(`Skipped ${index}. REASON: url not found!`);
      return;
    } else {
      obj.url = urlParse;
      obj.title = titleParse.replace(/ /g, "_");

      seriesList.push(obj);
    }
  });

  return seriesList;
}
