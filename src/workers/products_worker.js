const { parentPort, workerData } = require("worker_threads");
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeSeries(series) {
  const products = [];

  try {
    const { data } = await axios.get(series.url);
    const $ = cheerio.load(data, null, false);
    const shopList = $("div.shop-with-sidebar li");

    shopList.each((_idx, el) => {
      const obj = {};
      obj.name = $(el).find("h2.woocommerce-loop-product__title").text() || "no-title";
      obj.price = $(el).find("span.price").text() || "no-price";
      obj.image = $(el).find("img.wp-post-image").attr("src") || "no-image";
      obj.seriesId = series.id;
      products.push(obj);
    });
  } catch (err) {
    console.log(err);
  }

  console.log('WORKER PRODUCT LEN: ', products.length);
  return products;
}

if (parentPort) {
  const series = workerData.series;

  scrapeSeries(series).then(workerProducts => {
    parentPort.postMessage(workerProducts);
  });
}