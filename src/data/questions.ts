/**
 * SAMPLE QUESTION BANK - mirrors the Fundly 1.0 brief. In production this list is
 * fetched from the API (eligibilityService.getQuestions) and rendered by
 * <QuestionField>. Weights and rule references are intentionally null: the mapping
 * from questions to scoring areas has not been approved yet.
 */
import en, { type Dict } from '@/i18n/en';
import bn from '@/i18n/bn';
import type { Localized, Question, QuestionOption } from '@/types';

const both = (pick: (d: Dict) => string): Localized => ({ en: pick(en), bn: pick(bn) });

/** Build options from a dictionary group, e.g. options.industry */
function fromDict<K extends keyof Dict['options']>(group: K): QuestionOption[] {
  return Object.keys(en.options[group]).map((value) => ({
    value,
    label: both((d) => (d.options[group] as Record<string, string>)[value]),
  }));
}

const opt = (value: string, enLabel: string, bnLabel: string): QuestionOption => ({
  value,
  label: { en: enLabel, bn: bnLabel },
});

const yesNo = [opt('yes', 'Yes', 'হ্যাঁ'), opt('no', 'No', 'না')];

const base = { weight: null, ruleRef: null, active: true, required: true } as const;

export const sampleQuestions: Question[] = [
  // Step 1 - Business information (prefilled from the business profile)
  {
    ...base,
    id: 'Q-BI-01',
    step: 1,
    category: 'business_information',
    answerType: 'select',
    text: { en: 'How long has the business been operating?', bn: 'ব্যবসাটি কত দিন ধরে চলছে?' },
    options: fromDict('businessAge'),
    prefillFrom: 'businessAge',
  },
  {
    ...base,
    id: 'Q-BI-02',
    step: 1,
    category: 'business_information',
    answerType: 'select',
    text: { en: 'Which industry is the business in?', bn: 'ব্যবসাটি কোন শিল্পখাতে?' },
    options: fromDict('industry'),
    prefillFrom: 'industry',
  },
  {
    ...base,
    id: 'Q-BI-03',
    step: 1,
    category: 'business_information',
    answerType: 'select',
    text: { en: 'What type of business is it?', bn: 'ব্যবসার ধরন কী?' },
    options: fromDict('businessType'),
    prefillFrom: 'businessType',
  },
  {
    ...base,
    id: 'Q-BI-04',
    step: 1,
    category: 'business_information',
    answerType: 'select',
    text: { en: 'Where is the business located?', bn: 'ব্যবসাটি কোথায় অবস্থিত?' },
    options: fromDict('location'),
    prefillFrom: 'location',
  },

  // Step 2 - Business financials and records
  {
    ...base,
    id: 'Q-FN-01',
    step: 2,
    category: 'financials',
    answerType: 'currency',
    text: { en: 'What is the business’s average monthly revenue?', bn: 'ব্যবসার গড় মাসিক আয় (বিক্রি) কত?' },
    help: { en: 'An estimate in BDT is fine.', bn: 'টাকায় আনুমানিক হিসাব দিলেই হবে।' },
  },
  {
    ...base,
    id: 'Q-FN-02',
    step: 2,
    category: 'financials',
    answerType: 'single_choice',
    text: { en: 'Is the business profitable?', bn: 'ব্যবসাটি কি লাভে চলছে?' },
    options: [
      opt('profitable', 'Profitable', 'লাভে চলছে'),
      opt('break_even', 'Break-even', 'লাভ-ক্ষতি সমান'),
      opt('loss_making', 'Loss-making', 'লোকসানে চলছে'),
      opt('not_sure', 'Not sure', 'নিশ্চিত নই'),
    ],
  },
  {
    ...base,
    id: 'Q-FR-01',
    step: 2,
    category: 'financial_records',
    answerType: 'single_choice',
    text: { en: 'How are the business’s financial records kept?', bn: 'ব্যবসার আর্থিক রেকর্ড কীভাবে রাখা হয়?' },
    options: [
      opt('complete', 'Complete', 'সম্পূর্ণ'),
      opt('partial', 'Partial', 'আংশিক'),
      opt('not_maintained', 'Not maintained', 'রাখা হয় না'),
    ],
  },

  // Step 3 - Banking
  {
    ...base,
    id: 'Q-BK-01',
    step: 3,
    category: 'banking',
    answerType: 'single_choice',
    text: { en: 'Does the business have its own bank account?', bn: 'ব্যবসার নিজস্ব ব্যাংক অ্যাকাউন্ট আছে কি?' },
    options: yesNo,
  },
  {
    ...base,
    id: 'Q-BK-02',
    step: 3,
    category: 'banking',
    answerType: 'single_choice',
    text: { en: 'Do business transactions go through the bank regularly?', bn: 'ব্যবসার লেনদেন কি নিয়মিত ব্যাংকের মাধ্যমে হয়?' },
    options: [...yesNo, opt('partially', 'Partially', 'আংশিক')],
  },
  {
    ...base,
    id: 'Q-BK-03',
    step: 3,
    category: 'banking',
    answerType: 'single_choice',
    text: { en: 'Can you provide business bank statements?', bn: 'ব্যবসার ব্যাংক স্টেটমেন্ট দিতে পারবেন কি?' },
    options: [...yesNo, opt('partial', 'Partial', 'আংশিক')],
  },

  // Step 4 - Compliance
  {
    ...base,
    id: 'Q-CP-01',
    step: 4,
    category: 'compliance',
    answerType: 'single_choice',
    text: { en: 'What is the status of your trade licence?', bn: 'আপনার ট্রেড লাইসেন্সের অবস্থা কী?' },
    options: [opt('valid', 'Valid', 'বৈধ'), opt('expired', 'Expired', 'মেয়াদোত্তীর্ণ'), opt('not_available', 'Not available', 'নেই')],
  },
  {
    ...base,
    id: 'Q-CP-02',
    step: 4,
    category: 'compliance',
    answerType: 'single_choice',
    text: { en: 'Does the business have a TIN?', bn: 'ব্যবসার TIN আছে কি?' },
    options: [opt('available', 'Available', 'আছে'), opt('not_available', 'Not available', 'নেই')],
  },
  {
    ...base,
    id: 'Q-CP-03',
    step: 4,
    category: 'compliance',
    answerType: 'single_choice',
    text: { en: 'Does the business have a BIN?', bn: 'ব্যবসার BIN আছে কি?' },
    options: [
      opt('available', 'Available', 'আছে'),
      opt('not_available', 'Not available', 'নেই'),
      opt('not_applicable', 'Not applicable', 'প্রযোজ্য নয়'),
    ],
  },

  // Step 5 - Existing debt
  {
    ...base,
    id: 'Q-DB-01',
    step: 5,
    category: 'existing_debt',
    answerType: 'single_choice',
    text: { en: 'Does the business have an existing business loan?', bn: 'ব্যবসার কি বর্তমানে কোনো ব্যবসায়িক ঋণ আছে?' },
    options: yesNo,
  },
  {
    ...base,
    id: 'Q-DB-02',
    step: 5,
    category: 'existing_debt',
    answerType: 'currency',
    text: { en: 'How much is still outstanding?', bn: 'এখনো কত টাকা পরিশোধ বাকি?' },
    showWhen: { questionId: 'Q-DB-01', equals: 'yes' },
  },
  {
    ...base,
    id: 'Q-DB-03',
    step: 5,
    category: 'existing_debt',
    answerType: 'currency',
    text: { en: 'What is the monthly repayment?', bn: 'মাসিক কিস্তি কত?' },
    showWhen: { questionId: 'Q-DB-01', equals: 'yes' },
  },
  {
    ...base,
    id: 'Q-DB-04',
    step: 5,
    category: 'existing_debt',
    answerType: 'single_choice',
    text: { en: 'How are repayments going?', bn: 'কিস্তি পরিশোধ কেমন চলছে?' },
    options: [
      opt('on_time', 'On time', 'সময়মতো'),
      opt('sometimes_late', 'Sometimes late', 'মাঝে মাঝে দেরি হয়'),
      opt('overdue', 'Overdue', 'বকেয়া পড়েছে'),
    ],
    showWhen: { questionId: 'Q-DB-01', equals: 'yes' },
  },

  // Step 6 - Funding requirement
  {
    ...base,
    id: 'Q-FD-01',
    step: 6,
    category: 'funding_requirement',
    answerType: 'currency',
    text: { en: 'How much funding do you need?', bn: 'কত টাকার funding দরকার?' },
  },
  {
    ...base,
    id: 'Q-FD-02',
    step: 6,
    category: 'funding_requirement',
    answerType: 'select',
    text: { en: 'What is the funding for?', bn: 'Funding কী কাজে লাগবে?' },
    options: fromDict('purpose'),
  },
  {
    ...base,
    id: 'Q-FD-03',
    step: 6,
    category: 'funding_requirement',
    answerType: 'single_choice',
    text: { en: 'When do you need the funding?', bn: 'Funding কবে দরকার?' },
    options: [
      opt('within_1m', 'Within a month', 'এক মাসের মধ্যে'),
      opt('1_3m', 'In 1–3 months', '১–৩ মাসের মধ্যে'),
      opt('3_6m', 'In 3–6 months', '৩–৬ মাসের মধ্যে'),
      opt('later', 'Later than 6 months', '৬ মাসের পরে'),
    ],
  },
];

export const QUESTION_STEPS = 6; // plus a review step
