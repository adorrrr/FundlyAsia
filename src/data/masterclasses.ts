/**
 * MASTERCLASS DATA
 *
 * `launchMasterclasses` - content taken from the Fundly brief and the current Fundly site:
 *   Loan Lab, 15 Oct 2026, 4:00 PM, Dhaka, ~2 hours, 30 seats, 999 BDT, registration open.
 *   Speaker, exact venue and registration deadline are not confirmed, so they are left empty
 *   and the UI shows "To be announced".
 *
 * `sampleMasterclasses` - DEMO-ONLY events used to preview other states (full, closed,
 *   completed, draft). They are included only in development or when VITE_SAMPLE_EVENTS=true,
 *   and are flagged `sample: true` so the UI labels them.
 *
 * Cover photos come from ./masterclassCovers (royalty-free, stored locally). Replace them
 * with real event photography when the client supplies it.
 */
import type { Masterclass, Speaker } from '@/types';
import { covers } from './masterclassCovers';

/** Spread a cover into a masterclass record. */
const coverFields = (c: (typeof covers)[keyof typeof covers]) => ({ cover: c.src, coverSrcSet: c.srcSet, coverAlt: c.alt, coverCredit: { name: c.credit.name, url: c.credit.url } });

export const INCLUDE_SAMPLE_EVENTS: boolean = import.meta.env.DEV || import.meta.env.VITE_SAMPLE_EVENTS === 'true';

/** Placeholder speakers for demo events only - clearly named as placeholders. */
export const sampleSpeakers: Speaker[] = [
  {
    id: 'sp-sample-1',
    name: 'Sample speaker A',
    designation: 'Placeholder - replace before launch',
    institution: 'Not confirmed',
    bio: {
      en: 'Placeholder profile for preview. Add the confirmed speaker’s bio in the admin panel.',
      bn: 'প্রিভিউয়ের জন্য নমুনা প্রোফাইল। অ্যাডমিন প্যানেল থেকে নিশ্চিত বক্তার পরিচিতি যোগ করুন।',
    },
  },
  {
    id: 'sp-sample-2',
    name: 'Sample speaker B',
    designation: 'Placeholder - replace before launch',
    institution: 'Not confirmed',
    bio: {
      en: 'Placeholder profile for preview. Add the confirmed speaker’s bio in the admin panel.',
      bn: 'প্রিভিউয়ের জন্য নমুনা প্রোফাইল। অ্যাডমিন প্যানেল থেকে নিশ্চিত বক্তার পরিচিতি যোগ করুন।',
    },
  },
];

const loanLabLearn = [
  { en: 'What a bank checks before it says yes to an SME loan', bn: 'SME লোনে হ্যাঁ বলার আগে ব্যাংক কী কী যাচাই করে' },
  { en: 'The documents to have ready, and how to organise them', bn: 'কোন কাগজপত্র প্রস্তুত রাখবেন এবং কীভাবে গোছাবেন' },
  { en: 'How your records and bank statements tell your story', bn: 'আপনার হিসাব ও ব্যাংক স্টেটমেন্ট কীভাবে আপনার ব্যবসার গল্প বলে' },
  { en: 'A practical checklist and your own next step', bn: 'কাজের একটি checklist এবং আপনার নিজের পরের ধাপ' },
];

export const launchMasterclasses: Masterclass[] = [
  {
    id: 'mc-101',
    slug: 'loan-lab-how-banks-evaluate',
    title: {
      en: 'Fundly Loan Lab: How Banks Evaluate Your Business Before Approving a Loan',
      bn: 'Fundly Loan Lab: লোন অনুমোদনের আগে ব্যাংক কীভাবে আপনার ব্যবসা মূল্যায়ন করে',
    },
    topic: { en: 'Bank readiness for SMEs', bn: 'SME-দের bank readiness' },
    summary: {
      en: 'An offline masterclass on what banks look for, with a practical checklist and live Q&A.',
      bn: 'ব্যাংক কী দেখে তা নিয়ে অফলাইন মাস্টারক্লাস - কাজের checklist ও সরাসরি প্রশ্নোত্তর সহ।',
    },
    description: {
      en: 'Loan Lab is Fundly’s main programme: an offline masterclass on bank readiness. An expert-led session walks you through what banks look for, with a practical checklist, live Q&A and guidance on your next step. You leave with clarity on what lenders check and a direction for your readiness.',
      bn: 'Loan Lab হলো Fundly-র মূল প্রোগ্রাম - bank readiness নিয়ে একটি অফলাইন মাস্টারক্লাস। বিশেষজ্ঞের নেতৃত্বে সেশনে দেখানো হবে ব্যাংক কী দেখে, সাথে থাকবে কাজের checklist, সরাসরি প্রশ্নোত্তর এবং পরের ধাপের নির্দেশনা। ঋণদাতারা কী যাচাই করেন তা পরিষ্কার হবে, আর readiness-এর একটি দিক-নির্দেশনা পাবেন।',
    },
    learn: loanLabLearn,
    date: '2026-10-15',
    startTime: '16:00',
    endTime: '18:00',
    venue: { en: 'Dhaka - venue to be announced', bn: 'ঢাকা - স্থান পরে জানানো হবে' },
    capacity: 30,
    seatsTaken: 0,
    registrationDeadline: '',
    fee: 999,
    status: 'registration_open',
    speakerId: '',
    coverTone: 'leaf',
    ...coverFields(covers.loanLab),
  },
];

const sampleNote = { en: 'Sample event for preview only - not scheduled.', bn: 'শুধু প্রিভিউয়ের জন্য নমুনা ইভেন্ট - নির্ধারিত নয়।' };

export const sampleMasterclasses: Masterclass[] = [
  {
    id: 'mc-102',
    slug: 'sample-bookkeeping',
    sample: true,
    title: { en: 'Bookkeeping that banks trust', bn: 'যে হিসাব ব্যাংক বিশ্বাস করে' },
    topic: { en: 'Financial records', bn: 'আর্থিক রেকর্ড' },
    summary: sampleNote,
    description: {
      en: 'Sample event used to preview a full session. Set up simple, consistent records that make sales and costs easy for a lender to read.',
      bn: 'পূর্ণ সেশন দেখানোর জন্য নমুনা ইভেন্ট। সহজ ও নিয়মিত হিসাব রাখুন, যাতে ঋণদাতা বিক্রি ও খরচ সহজে বুঝতে পারেন।',
    },
    learn: [
      { en: 'A monthly bookkeeping routine you can keep', bn: 'একটি মাসিক হিসাবরক্ষণ রুটিন যা আপনি মেনে চলতে পারবেন' },
      { en: 'Separating business and personal money', bn: 'ব্যবসা ও ব্যক্তিগত টাকা আলাদা রাখা' },
    ],
    date: '2026-11-21',
    startTime: '10:00',
    endTime: '12:30',
    venue: { en: 'To be announced', bn: 'পরে জানানো হবে' },
    capacity: 25,
    seatsTaken: 25,
    registrationDeadline: '2026-11-18',
    fee: 999,
    status: 'registration_open',
    speakerId: 'sp-sample-2',
    coverTone: 'sky',
    ...coverFields(covers.bookkeeping),
  },
  {
    id: 'mc-103',
    slug: 'sample-loan-lab-batch-02',
    sample: true,
    title: { en: 'Loan Lab - second batch', bn: 'Loan Lab - দ্বিতীয় ব্যাচ' },
    topic: { en: 'Bank readiness for SMEs', bn: 'SME-দের bank readiness' },
    summary: sampleNote,
    description: {
      en: 'Sample event used to preview an open session with seats remaining.',
      bn: 'আসন বাকি থাকা একটি খোলা সেশন দেখানোর জন্য নমুনা ইভেন্ট।',
    },
    learn: loanLabLearn,
    date: '2026-12-05',
    startTime: '16:00',
    endTime: '18:00',
    venue: { en: 'To be announced', bn: 'পরে জানানো হবে' },
    capacity: 30,
    seatsTaken: 0,
    registrationDeadline: '2026-12-01',
    fee: 999,
    status: 'registration_open',
    speakerId: 'sp-sample-1',
    coverTone: 'sky',
    ...coverFields(covers.loanLab02),
  },
  {
    id: 'mc-104',
    slug: 'sample-trade-licence-tin-bin',
    sample: true,
    title: { en: 'Trade licence, TIN and BIN', bn: 'ট্রেড লাইসেন্স, TIN ও BIN' },
    topic: { en: 'Compliance basics', bn: 'Compliance-এর মূল বিষয়' },
    summary: sampleNote,
    description: {
      en: 'Sample event used to preview a free session whose registration has closed.',
      bn: 'রেজিস্ট্রেশন বন্ধ হয়ে যাওয়া একটি বিনামূল্যের সেশন দেখানোর জন্য নমুনা ইভেন্ট।',
    },
    learn: [
      { en: 'When you need a TIN and when you need a BIN', bn: 'কখন TIN আর কখন BIN দরকার' },
      { en: 'Keeping your trade licence valid', bn: 'ট্রেড লাইসেন্স বৈধ রাখা' },
    ],
    date: '2026-10-25',
    startTime: '11:00',
    endTime: '12:00',
    venue: { en: 'To be announced', bn: 'পরে জানানো হবে' },
    capacity: 40,
    seatsTaken: 0,
    registrationDeadline: '2026-10-20',
    fee: 0,
    status: 'registration_closed',
    speakerId: 'sp-sample-2',
    coverTone: 'leaf',
    ...coverFields(covers.compliance),
  },
  {
    id: 'mc-100',
    slug: 'sample-loan-lab-pilot',
    sample: true,
    title: { en: 'Loan Lab - pilot session', bn: 'Loan Lab - পাইলট সেশন' },
    topic: { en: 'Bank readiness for SMEs', bn: 'SME-দের bank readiness' },
    summary: sampleNote,
    description: { en: 'Sample event used to preview a completed session.', bn: 'সম্পন্ন একটি সেশন দেখানোর জন্য নমুনা ইভেন্ট।' },
    learn: loanLabLearn.slice(0, 2),
    date: '2026-09-20',
    startTime: '15:00',
    endTime: '17:00',
    venue: { en: 'To be announced', bn: 'পরে জানানো হবে' },
    capacity: 20,
    seatsTaken: 0,
    registrationDeadline: '2026-09-16',
    fee: 0,
    status: 'completed',
    speakerId: 'sp-sample-1',
    coverTone: 'leaf',
    ...coverFields(covers.pilot),
  },
  {
    id: 'mc-105',
    slug: 'sample-women-entrepreneurs',
    sample: true,
    title: { en: 'Women entrepreneurs and formal finance', bn: 'নারী উদ্যোক্তা ও formal finance' },
    topic: { en: 'First-time borrowing', bn: 'প্রথমবার ঋণ নেওয়া' },
    summary: sampleNote,
    description: { en: 'Draft - content to be finalised.', bn: 'খসড়া - বিষয়বস্তু চূড়ান্ত করা হবে।' },
    learn: [{ en: 'To be finalised', bn: 'চূড়ান্ত করা হবে' }],
    date: '',
    startTime: '',
    endTime: '',
    venue: { en: 'To be announced', bn: 'পরে জানানো হবে' },
    capacity: 30,
    seatsTaken: 0,
    registrationDeadline: '',
    fee: 999,
    status: 'draft',
    speakerId: '',
    coverTone: 'sand',
    ...coverFields(covers.womenEntrepreneurs),
  },
];

export const allMasterclasses: Masterclass[] = INCLUDE_SAMPLE_EVENTS ? [...launchMasterclasses, ...sampleMasterclasses] : launchMasterclasses;
export const allSpeakers: Speaker[] = INCLUDE_SAMPLE_EVENTS ? sampleSpeakers : [];
