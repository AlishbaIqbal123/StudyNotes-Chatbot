export interface QuranAyah {
  arabic: string;
  translation: string;
  reference: string;
}

/** Curated ayahs on knowledge, patience, and seeking understanding */
export const QURAN_AYAHS: QuranAyah[] = [
  {
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord, increase me in knowledge.',
    reference: 'Surah Ta-Ha 20:114',
  },
  {
    arabic: 'وَمَن يُؤْتَ الْحِكْمَةَ فَقَدْ أُوتِيَ خَيْرًا كَثِيرًا',
    translation: 'Whoever is given wisdom has been given much good.',
    reference: 'Surah Al-Baqarah 2:269',
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    translation: 'So remember Me; I will remember you.',
    reference: 'Surah Al-Baqarah 2:152',
  },
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease.',
    reference: 'Surah Ash-Sharh 94:6',
  },
  {
    arabic: 'وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ',
    translation: 'My Lord, cause me to enter a sound entrance and to exit a sound exit.',
    reference: 'Surah Al-Isra 17:80',
  },
  {
    arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
    translation: 'My success is not but through Allah.',
    reference: 'Surah Hud 11:88',
  },
  {
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    translation: 'Those who strive for Us — We will guide them to Our ways.',
    reference: 'Surah Al-Ankabut 29:69',
  },
  {
    arabic: 'وَقُلْ رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    translation: 'My Lord, have mercy upon them as they brought me up when I was small.',
    reference: 'Surah Al-Isra 17:24',
  },
  {
    arabic: 'وَمَا أُوتِيتُم مِّنَ الْعِلْمِ إِلَّا قَلِيلًا',
    translation: 'You have been given of knowledge only a little.',
    reference: 'Surah Al-Isra 17:85',
  },
  {
    arabic: 'وَمَا أَرْسَلْنَا مِن قَبْلِكَ إِلَّا رِجَالًا نُّوحِي إِلَيْهِمْ',
    translation: 'We sent not before you except men to whom We revealed.',
    reference: 'Surah An-Nahl 16:43',
  },
  {
    arabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    translation: 'Allah will raise those who believe and those who were given knowledge by degrees.',
    reference: 'Surah Al-Mujadila 58:11',
  },
  {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'Whoever fears Allah — He will make for him a way out.',
    reference: 'Surah At-Talaq 65:2',
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    translation: 'Our Lord, give us good in this world and good in the Hereafter.',
    reference: 'Surah Al-Baqarah 2:201',
  },
  {
    arabic: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ',
    translation: 'Be patient, and your patience is only through Allah.',
    reference: 'Surah An-Nahl 16:127',
  },
  {
    arabic: 'قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ',
    translation: 'Are those who know equal to those who do not know?',
    reference: 'Surah Az-Zumar 39:9',
  },
];

export function getDailyAyahIndex(date = new Date()): number {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % QURAN_AYAHS.length;
}

export function getDailyAyah(date = new Date()): QuranAyah {
  return QURAN_AYAHS[getDailyAyahIndex(date)];
}

export function getRandomAyah(): QuranAyah {
  return QURAN_AYAHS[Math.floor(Math.random() * QURAN_AYAHS.length)];
}
