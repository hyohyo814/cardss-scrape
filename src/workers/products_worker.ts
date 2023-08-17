import {parentPort, workerData} from "worker_threads";
import axios from "axios";
import * as cheerio from "cheerio";
import prismaTypes from "../types/prismaTypes";

async function scrapeSeries(
  series: prismaTypes.Series
): Promise<prismaTypes.ProductBase[]> {
  const products = new Array<prismaTypes.ProductBase>();
  try {
    console.log("=====================================");
    console.time("outer");
    console.time("url");
    const {data} = await axios.get(series.url);
    console.timeEnd("url");

    const $ = cheerio.load(data, null, false);
    const shopList = $("div.shop-with-sidebar li");

    console.time("inner-loop");
    shopList.each((_idx, el) => {
      const obj = {} as prismaTypes.ProductBase;
      const name =
        $(el).find("h2.woocommerce-loop-product__title").text() ?? "no-title";
      const price = $(el).find("span.price").text() ?? "no-price";
      const image = $(el).find("img.wp-post-image").attr("src") ?? "no-image";

      obj.name = name;
      obj.price = price;
      obj.image = image;
      obj.seriesId = series.id;

      products.push(obj);
      return;
    });
    console.timeEnd("inner-loop");
    console.timeEnd("outer");
    console.log("=====================================");
  } catch (err) {
    console.log(err);
  }

  return products;
}

if (parentPort) {
  const series = workerData.series;

  scrapeSeries(series).then(workerProducts => {
    parentPort?.postMessage(workerProducts);
  });
}
