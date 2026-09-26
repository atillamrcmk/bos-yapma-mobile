/**
 * Legacy Which Came First pair list.
 * Runtime challenges now come from `src/content/knowledge`.
 * This file is retained so historical curated pairs are not deleted.
 */
export interface WhichCameFirstPair {
  id: string;
  optionA: string;
  optionB: string;
  firstId: 'a' | 'b';
  yearA: number;
  yearB: number;
}

/** @deprecated Prefer `buildWhichCameFirstChallenge` from `@/content/knowledge`. */
export const whichCameFirstPairs: WhichCameFirstPair[] = [
  {
    id: 'youtube-twitter',
    optionA: 'YouTube',
    optionB: 'Twitter',
    firstId: 'a',
    yearA: 2005,
    yearB: 2006,
  },
  {
    id: 'iphone-android',
    optionA: 'iPhone',
    optionB: 'Android',
    firstId: 'a',
    yearA: 2007,
    yearB: 2008,
  },
  {
    id: 'facebook-instagram',
    optionA: 'Facebook',
    optionB: 'Instagram',
    firstId: 'a',
    yearA: 2004,
    yearB: 2010,
  },
  {
    id: 'google-amazon',
    optionA: 'Google',
    optionB: 'Amazon',
    firstId: 'b',
    yearA: 1998,
    yearB: 1994,
  },
  {
    id: 'wifi-bluetooth',
    optionA: 'Wi-Fi',
    optionB: 'Bluetooth',
    firstId: 'b',
    yearA: 1997,
    yearB: 1994,
  },
  {
    id: 'penicillin-xray',
    optionA: 'Penisilin',
    optionB: 'X-Ray',
    firstId: 'b',
    yearA: 1928,
    yearB: 1895,
  },
  {
    id: 'telephone-radio',
    optionA: 'Telefon',
    optionB: 'Radyo',
    firstId: 'a',
    yearA: 1876,
    yearB: 1895,
  },
  {
    id: 'lightbulb-phonograph',
    optionA: 'Ampul',
    optionB: 'Fonograf',
    firstId: 'b',
    yearA: 1879,
    yearB: 1877,
  },
  {
    id: 'steam-train',
    optionA: 'Buharlı tren',
    optionB: 'Telegraf',
    firstId: 'b',
    yearA: 1804,
    yearB: 1837,
  },
  {
    id: 'printing-compass',
    optionA: 'Matbaa',
    optionB: 'Pusula',
    firstId: 'b',
    yearA: 1440,
    yearB: 1100,
  },
  {
    id: 'netflix-spotify',
    optionA: 'Netflix',
    optionB: 'Spotify',
    firstId: 'a',
    yearA: 1997,
    yearB: 2006,
  },
  {
    id: 'whatsapp-telegram',
    optionA: 'WhatsApp',
    optionB: 'Telegram',
    firstId: 'a',
    yearA: 2009,
    yearB: 2013,
  },
  {
    id: 'tesla-spacex',
    optionA: 'Tesla (şirket)',
    optionB: 'SpaceX',
    firstId: 'a',
    yearA: 2003,
    yearB: 2002,
  },
  {
    id: 'atm-credit-card',
    optionA: 'ATM',
    optionB: 'Kredi kartı',
    firstId: 'b',
    yearA: 1967,
    yearB: 1950,
  },
  {
    id: 'microwave-toaster',
    optionA: 'Mikrodalga',
    optionB: 'Tost makinesi',
    firstId: 'b',
    yearA: 1946,
    yearB: 1921,
  },
  {
    id: 'zipper-velcro',
    optionA: 'Fermuar',
    optionB: 'Cırt cırt',
    firstId: 'a',
    yearA: 1913,
    yearB: 1955,
  },
  {
    id: 'postit-sticky',
    optionA: 'Post-it',
    optionB: 'Super Glue',
    firstId: 'b',
    yearA: 1974,
    yearB: 1951,
  },
  {
    id: 'barcode-qr',
    optionA: 'Barkod',
    optionB: 'QR kod',
    firstId: 'a',
    yearA: 1974,
    yearB: 1994,
  },
  { id: 'email-sms', optionA: 'E-posta', optionB: 'SMS', firstId: 'a', yearA: 1971, yearB: 1992 },
  { id: 'gps-satnav', optionA: 'GPS', optionB: 'Uydu TV', firstId: 'a', yearA: 1978, yearB: 1962 },
  { id: 'cd-dvd', optionA: 'CD', optionB: 'DVD', firstId: 'a', yearA: 1982, yearB: 1995 },
  { id: 'kindle-ipad', optionA: 'Kindle', optionB: 'iPad', firstId: 'a', yearA: 2007, yearB: 2010 },
  { id: 'uber-airbnb', optionA: 'Uber', optionB: 'Airbnb', firstId: 'b', yearA: 2009, yearB: 2008 },
  {
    id: 'tesla-coil-ac',
    optionA: 'Tesla bobini',
    optionB: 'AC elektrik şebekesi',
    firstId: 'b',
    yearA: 1891,
    yearB: 1882,
  },
  {
    id: 'world-wide-web',
    optionA: 'World Wide Web',
    optionB: 'İnternet (ARPANET)',
    firstId: 'b',
    yearA: 1989,
    yearB: 1969,
  },
  {
    id: 'nintendo-sony-ps',
    optionA: 'Nintendo',
    optionB: 'PlayStation',
    firstId: 'a',
    yearA: 1889,
    yearB: 1994,
  },
  {
    id: 'coca-pepsi',
    optionA: 'Coca-Cola',
    optionB: 'Pepsi',
    firstId: 'a',
    yearA: 1886,
    yearB: 1893,
  },
];
