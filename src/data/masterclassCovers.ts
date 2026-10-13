/**
 * Masterclass cover photography.
 *
 * Royalty-free photos from Unsplash (Unsplash License: free for commercial use, no
 * permission needed). Downloaded once, cropped to 16:9 and stored locally as WebP at
 * three widths, so nothing is hotlinked. Credits are kept here and shown on the
 * masterclass detail page.
 *
 * These are representative photos, not pictures of Fundly events. Replace them with
 * real Loan Lab photography once the client has it.
 */
import type { Localized } from '@/types';
import loanLab640 from '@/assets/masterclasses/loan-lab-640.webp';
import loanLab1024 from '@/assets/masterclasses/loan-lab-1024.webp';
import loanLab1600 from '@/assets/masterclasses/loan-lab-1600.webp';
import loanLab02_640 from '@/assets/masterclasses/loan-lab-02-640.webp';
import loanLab02_1024 from '@/assets/masterclasses/loan-lab-02-1024.webp';
import loanLab02_1600 from '@/assets/masterclasses/loan-lab-02-1600.webp';
import pilot640 from '@/assets/masterclasses/loan-lab-pilot-640.webp';
import pilot1024 from '@/assets/masterclasses/loan-lab-pilot-1024.webp';
import pilot1600 from '@/assets/masterclasses/loan-lab-pilot-1600.webp';
import books640 from '@/assets/masterclasses/bookkeeping-640.webp';
import books1024 from '@/assets/masterclasses/bookkeeping-1024.webp';
import books1600 from '@/assets/masterclasses/bookkeeping-1600.webp';
import compliance640 from '@/assets/masterclasses/compliance-640.webp';
import compliance1024 from '@/assets/masterclasses/compliance-1024.webp';
import compliance1600 from '@/assets/masterclasses/compliance-1600.webp';
import women640 from '@/assets/masterclasses/entrepreneur-640.webp';
import women1024 from '@/assets/masterclasses/entrepreneur-1024.webp';
import women1600 from '@/assets/masterclasses/entrepreneur-1600.webp';

export interface CoverImage {
  src: string;
  srcSet: string;
  alt: Localized;
  credit: { name: string; url: string };
}

const set = (a: string, b: string, c: string) => ({ src: b, srcSet: `${a} 640w, ${b} 1024w, ${c} 1600w` });
const unsplash = (name: string, username: string, photoId: string) => ({
  name,
  url: `https://unsplash.com/photos/${photoId}?utm_source=fundly&utm_medium=referral`,
  profile: `https://unsplash.com/@${username}`,
});

export const covers = {
  loanLab: {
    ...set(loanLab640, loanLab1024, loanLab1600),
    alt: {
      en: 'A presenter speaks at the front of a workshop room while participants follow the slides.',
      bn: 'কর্মশালার সামনে একজন উপস্থাপক কথা বলছেন, অংশগ্রহণকারীরা স্লাইড দেখছেন।',
    },
    credit: unsplash('Quilia', 'heyquilia', '1-aA2Fadydc'),
  },
  loanLab02: {
    ...set(loanLab02_640, loanLab02_1024, loanLab02_1600),
    alt: {
      en: 'A presenter walks a small group through a sales chart on a screen.',
      bn: 'একজন উপস্থাপক ছোট একটি দলকে স্ক্রিনে বিক্রির চার্ট বুঝিয়ে দিচ্ছেন।',
    },
    credit: unsplash('Vitaly Gariev', 'silverkblack', 'LzBMjkvZfh8'),
  },
  pilot: {
    ...set(pilot640, pilot1024, pilot1600),
    alt: {
      en: 'Adults listening during a workshop in a bright room.',
      bn: 'উজ্জ্বল একটি কক্ষে কর্মশালায় মনোযোগ দিয়ে শুনছেন অংশগ্রহণকারীরা।',
    },
    credit: unsplash('Timur Shakerzianov', 'shaker_jpg', 'yCs7YTwEw2w'),
  },
  bookkeeping: {
    ...set(books640, books1024, books1600),
    alt: {
      en: 'Hands using a calculator next to a notebook and printed figures.',
      bn: 'নোটবুক ও ছাপানো হিসাবের পাশে ক্যালকুলেটর ব্যবহার করা হচ্ছে।',
    },
    credit: unsplash('Jakub Żerdzicki', 'jakubzerdzicki', 'LNnmSumlwO4'),
  },
  compliance: {
    ...set(compliance640, compliance1024, compliance1600),
    alt: {
      en: 'A row of colourful document binders.',
      bn: 'সারি করে রাখা রঙিন ডকুমেন্ট ফাইল।',
    },
    credit: unsplash('Jonas Augustin', 'augustinfoto', 'MTqaqBY6lfA'),
  },
  womenEntrepreneurs: {
    ...set(women640, women1024, women1600),
    alt: {
      en: 'A smiling café owner stands behind her counter.',
      bn: 'নিজের কাউন্টারের পেছনে হাসিমুখে দাঁড়িয়ে আছেন একজন ক্যাফে মালিক।',
    },
    credit: unsplash('Vitaly Gariev', 'silverkblack', 'QGg-vsPYbu8'),
  },
} satisfies Record<string, CoverImage & { credit: { profile: string } }>;
