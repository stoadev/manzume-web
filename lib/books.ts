export interface BookCard {
  slug: string;
  name: string;
  author: string;
  blurb: string;
  available: boolean;
}

export const BOOKS: BookCard[] = [
  {
    slug: "divan-i-kenz-i-sumus",
    name: "Divân-ı Kenz-i Şümûs",
    author: "Eş-Şeyh Es-Seyyid İbrahim Halil",
    blurb: "Manzumeler; Latin ve Osmanlıca nüsha",
    available: true,
  },
  {
    slug: "kenzul-maarif",
    name: "Kenz'il-Maarif İlmihali",
    author: "Eş-Şeyh Es-Seyyid İbrahim Halil",
    blurb: "İlmihal; 559 bahis ve 35 manzume",
    available: true,
  },
];
