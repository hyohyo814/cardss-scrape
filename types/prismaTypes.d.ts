// prismaTypes.d.ts

declare namespace Prisma {
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

  export type SeriesBase = Omit<Series, 'id' | 'products'>

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

  export type ProductBase = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'series' | 'seriesId'>
}

export default Prisma;