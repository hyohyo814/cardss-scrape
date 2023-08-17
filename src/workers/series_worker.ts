import axios from "axios";
import prismaTypes from "../types/prismaTypes";
// import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

// const prisma = new PrismaClient();

export async function scrapeSeries(): Promise<Array<prismaTypes.SeriesBase>> {
  const url = "https://www.novatcg.com/product-category/weiss-schwarz-japanese";
  const {data} = await axios.get(url);
  const dataStr = data as string;

  const $ = cheerio.load(dataStr, null, false);
  const series = $(".products li");
  const seriesList = new Array<prismaTypes.SeriesBase>();

  series.each((index, el) => {
    const obj = {} as prismaTypes.SeriesBase;
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
      return;
    }
  });
  return seriesList;
}
