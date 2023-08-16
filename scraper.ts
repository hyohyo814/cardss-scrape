import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import prismaTypes from './types/prismaTypes';
import axios from 'axios';

const prisma = new PrismaClient();

async function scrapeSeries() {
  const url = 'https://www.novatcg.com/product-category/weiss-schwarz-japanese';

  const { data } = await axios.get(url);

  const $ = cheerio.load(data, null, false);
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

async function main () {
  const series = await scrapeSeries();

  series.forEach(async (series) => {
    await prisma.series.upsert({
      where: {
        title: series.title
      },
      update: {
        url: series.url,
      },
      create: {
        title: series.title,
        url: series.url,
      }
    })
  })

  console.log('complete title scraping')
}

main()
  .catch(error => {
    console.error('ERROR BOOM', error)
  })
  .finally(async () => {
    await prisma.$disconnect();
  });