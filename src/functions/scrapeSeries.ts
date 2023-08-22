import axios from "axios";
import { type Series } from "@prisma/client";
import * as cheerio from "cheerio";


export async function scrapeSeries(): Promise<Array<Series>> {
  const url = "https://www.novatcg.com/product-category/weiss-schwarz-japanese";
  const {data} = await axios.get(url);

  const $ = cheerio.load(data, null, false);
  const series = $(".products li");
  const seriesList = new Array<Series>();

  series.each((index, el) => {
    const obj = {} as Series;
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

