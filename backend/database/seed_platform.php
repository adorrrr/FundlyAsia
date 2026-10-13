<?php
declare(strict_types=1);

require __DIR__ . '/../src/Support/Env.php';
require __DIR__ . '/../src/Support/Db.php';

use Fundly\Support\Db;
use Fundly\Support\Env;

Env::load(__DIR__ . '/../.env');
$pdo = Db::pdo();
$now = Db::now();

// 1. Scoring Rules
$rules = [
    ['documentation', 'Documentation', 'কাগজপত্র', 20.00],
    ['compliance', 'Compliance', 'Compliance', 15.00],
    ['financial_health', 'Financial health', 'আর্থিক স্বাস্থ্য', 25.00],
    ['banking_readiness', 'Banking readiness', 'ব্যাংকিং প্রস্তুতি', 15.00],
    ['debt_capacity', 'Debt capacity', 'ঋণ বহনের সক্ষমতা', 10.00],
    ['funding_preparation', 'Funding preparation', 'Funding প্রস্তুতি', 15.00],
];

$st = $pdo->prepare('INSERT INTO scoring_rules (category_key, label_en, label_bn, weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE label_en = VALUES(label_en), label_bn = VALUES(label_bn), weight = VALUES(weight), updated_at = VALUES(updated_at)');
foreach ($rules as $r) {
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->prepare('INSERT OR REPLACE INTO scoring_rules (category_key, label_en, label_bn, weight, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')->execute([...$r, $now, $now]);
    } else {
        $st->execute([...$r, $now, $now]);
    }
}
echo "Scoring rules seeded.\n";

// Dictionaries for options
$businessAgeOpts = [
    ['value' => 'lt1', 'label' => ['en' => 'Less than 1 year', 'bn' => '১ বছরের কম']],
    ['value' => '1to3', 'label' => ['en' => '1–3 years', 'bn' => '১–৩ বছর']],
    ['value' => '3to5', 'label' => ['en' => '3–5 years', 'bn' => '৩–৫ বছর']],
    ['value' => '5to10', 'label' => ['en' => '5–10 years', 'bn' => '৫–১০ বছর']],
    ['value' => 'gt10', 'label' => ['en' => 'More than 10 years', 'bn' => '১০ বছরের বেশি']],
];

$industryOpts = [
    ['value' => 'retail', 'label' => ['en' => 'Retail & trading', 'bn' => 'খুচরা ও ব্যবসা-বাণিজ্য']],
    ['value' => 'manufacturing', 'label' => ['en' => 'Manufacturing', 'bn' => 'উৎপাদন']],
    ['value' => 'food', 'label' => ['en' => 'Food & beverage', 'bn' => 'খাদ্য ও পানীয়']],
    ['value' => 'apparel', 'label' => ['en' => 'Apparel & textiles', 'bn' => 'পোশাক ও বস্ত্র']],
    ['value' => 'agriculture', 'label' => ['en' => 'Agriculture & agro-processing', 'bn' => 'কৃষি ও কৃষি-প্রক্রিয়াজাতকরণ']],
    ['value' => 'services', 'label' => ['en' => 'Services', 'bn' => 'সেবা']],
    ['value' => 'ict', 'label' => ['en' => 'ICT & digital', 'bn' => 'আইসিটি ও ডিজিটাল']],
    ['value' => 'construction', 'label' => ['en' => 'Construction & materials', 'bn' => 'নির্মাণ ও নির্মাণসামগ্রী']],
    ['value' => 'healthcare', 'label' => ['en' => 'Healthcare & pharmacy', 'bn' => 'স্বাস্থ্যসেবা ও ফার্মেসি']],
    ['value' => 'other', 'label' => ['en' => 'Other', 'bn' => 'অন্যান্য']],
];

$businessTypeOpts = [
    ['value' => 'sole_proprietorship', 'label' => ['en' => 'Sole proprietorship', 'bn' => 'একক মালিকানা']],
    ['value' => 'partnership', 'label' => ['en' => 'Partnership', 'bn' => 'অংশীদারি']],
    ['value' => 'private_limited', 'label' => ['en' => 'Private limited', 'bn' => 'প্রাইভেট লিমিটেড']],
    ['value' => 'other', 'label' => ['en' => 'Other', 'bn' => 'অন্যান্য']],
];

$locationOpts = [
    ['value' => 'dhaka', 'label' => ['en' => 'Dhaka', 'bn' => 'ঢাকা']],
    ['value' => 'chattogram', 'label' => ['en' => 'Chattogram', 'bn' => 'চট্টগ্রাম']],
    ['value' => 'khulna', 'label' => ['en' => 'Khulna', 'bn' => 'খুলনা']],
    ['value' => 'rajshahi', 'label' => ['en' => 'Rajshahi', 'bn' => 'রাজশাহী']],
    ['value' => 'sylhet', 'label' => ['en' => 'Sylhet', 'bn' => 'সিলেট']],
    ['value' => 'barishal', 'label' => ['en' => 'Barishal', 'bn' => 'বরিশাল']],
    ['value' => 'rangpur', 'label' => ['en' => 'Rangpur', 'bn' => 'রংপুর']],
    ['value' => 'mymensingh', 'label' => ['en' => 'Mymensingh', 'bn' => 'ময়মনসিংহ']],
];

$purposeOpts = [
    ['value' => 'working_capital', 'label' => ['en' => 'Working capital', 'bn' => 'চলতি মূলধন']],
    ['value' => 'inventory', 'label' => ['en' => 'Inventory', 'bn' => 'মালামাল / ইনভেন্টরি']],
    ['value' => 'expansion', 'label' => ['en' => 'Expansion', 'bn' => 'ব্যবসা সম্প্রসারণ']],
    ['value' => 'equipment', 'label' => ['en' => 'Equipment', 'bn' => 'যন্ত্রপাতি']],
    ['value' => 'other', 'label' => ['en' => 'Other', 'bn' => 'অন্যান্য']],
];

$yesNo = [
    ['value' => 'yes', 'label' => ['en' => 'Yes', 'bn' => 'হ্যাঁ']],
    ['value' => 'no', 'label' => ['en' => 'No', 'bn' => 'না']],
];

$questions = [
    [
        'id' => 'Q-BI-01', 'step' => 1, 'category' => 'business_information', 'answer_type' => 'select',
        'text_en' => 'How long has the business been operating?', 'text_bn' => 'ব্যবসাটি কত দিন ধরে চলছে?',
        'help_en' => null, 'help_bn' => null, 'options' => $businessAgeOpts, 'prefill_from' => 'businessAge', 'show_when' => null, 'sort_order' => 1
    ],
    [
        'id' => 'Q-BI-02', 'step' => 1, 'category' => 'business_information', 'answer_type' => 'select',
        'text_en' => 'Which industry is the business in?', 'text_bn' => 'ব্যবসাটি কোন শিল্পখাতে?',
        'help_en' => null, 'help_bn' => null, 'options' => $industryOpts, 'prefill_from' => 'industry', 'show_when' => null, 'sort_order' => 2
    ],
    [
        'id' => 'Q-BI-03', 'step' => 1, 'category' => 'business_information', 'answer_type' => 'select',
        'text_en' => 'What type of business is it?', 'text_bn' => 'ব্যবসার ধরন কী?',
        'help_en' => null, 'help_bn' => null, 'options' => $businessTypeOpts, 'prefill_from' => 'businessType', 'show_when' => null, 'sort_order' => 3
    ],
    [
        'id' => 'Q-BI-04', 'step' => 1, 'category' => 'business_information', 'answer_type' => 'select',
        'text_en' => 'Where is the business located?', 'text_bn' => 'ব্যবসাটি কোথায় অবস্থিত?',
        'help_en' => null, 'help_bn' => null, 'options' => $locationOpts, 'prefill_from' => 'location', 'show_when' => null, 'sort_order' => 4
    ],
    [
        'id' => 'Q-FN-01', 'step' => 2, 'category' => 'financials', 'answer_type' => 'currency',
        'text_en' => 'What is the business’s average monthly revenue?', 'text_bn' => 'ব্যবসার গড় মাসিক আয় (বিক্রি) কত?',
        'help_en' => 'An estimate in BDT is fine.', 'help_bn' => 'টাকায় আনুমানিক হিসাব দিলেই হবে।',
        'options' => null, 'prefill_from' => null, 'show_when' => null, 'sort_order' => 5
    ],
    [
        'id' => 'Q-FN-02', 'step' => 2, 'category' => 'financials', 'answer_type' => 'single_choice',
        'text_en' => 'Is the business profitable?', 'text_bn' => 'ব্যবসাটি কি লাভে চলছে?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'profitable', 'label' => ['en' => 'Profitable', 'bn' => 'লাভে চলছে']],
            ['value' => 'break_even', 'label' => ['en' => 'Break-even', 'bn' => 'লাভ-ক্ষতি সমান']],
            ['value' => 'loss_making', 'label' => ['en' => 'Loss-making', 'bn' => 'লোকসানে চলছে']],
            ['value' => 'not_sure', 'label' => ['en' => 'Not sure', 'bn' => 'নিশ্চিত নই']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 6
    ],
    [
        'id' => 'Q-FR-01', 'step' => 2, 'category' => 'financial_records', 'answer_type' => 'single_choice',
        'text_en' => 'How are the business’s financial records kept?', 'text_bn' => 'ব্যবসার আর্থিক রেকর্ড কীভাবে রাখা হয়?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'complete', 'label' => ['en' => 'Complete', 'bn' => 'সম্পূর্ণ']],
            ['value' => 'partial', 'label' => ['en' => 'Partial', 'bn' => 'আংশিক']],
            ['value' => 'not_maintained', 'label' => ['en' => 'Not maintained', 'bn' => 'রাখা হয় না']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 7
    ],
    [
        'id' => 'Q-BK-01', 'step' => 3, 'category' => 'banking', 'answer_type' => 'single_choice',
        'text_en' => 'Does the business have its own bank account?', 'text_bn' => 'ব্যবসার নিজস্ব ব্যাংক অ্যাকাউন্ট আছে কি?',
        'help_en' => null, 'help_bn' => null, 'options' => $yesNo, 'prefill_from' => null, 'show_when' => null, 'sort_order' => 8
    ],
    [
        'id' => 'Q-BK-02', 'step' => 3, 'category' => 'banking', 'answer_type' => 'single_choice',
        'text_en' => 'Do business transactions go through the bank regularly?', 'text_bn' => 'ব্যবসার লেনদেন কি নিয়মিত ব্যাংকের মাধ্যমে হয়?',
        'help_en' => null, 'help_bn' => null,
        'options' => array_merge($yesNo, [['value' => 'partially', 'label' => ['en' => 'Partially', 'bn' => 'আংশিক']]]),
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 9
    ],
    [
        'id' => 'Q-BK-03', 'step' => 3, 'category' => 'banking', 'answer_type' => 'single_choice',
        'text_en' => 'Can you provide business bank statements?', 'text_bn' => 'ব্যবসার ব্যাংক স্টেটমেন্ট দিতে পারবেন কি?',
        'help_en' => null, 'help_bn' => null,
        'options' => array_merge($yesNo, [['value' => 'partial', 'label' => ['en' => 'Partial', 'bn' => 'আংশিক']]]),
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 10
    ],
    [
        'id' => 'Q-CP-01', 'step' => 4, 'category' => 'compliance', 'answer_type' => 'single_choice',
        'text_en' => 'What is the status of your trade licence?', 'text_bn' => 'আপনার ট্রেড লাইসেন্সের অবস্থা কী?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'valid', 'label' => ['en' => 'Valid', 'bn' => 'বৈধ']],
            ['value' => 'expired', 'label' => ['en' => 'Expired', 'bn' => 'মেয়াদোত্তীর্ণ']],
            ['value' => 'not_available', 'label' => ['en' => 'Not available', 'bn' => 'নেই']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 11
    ],
    [
        'id' => 'Q-CP-02', 'step' => 4, 'category' => 'compliance', 'answer_type' => 'single_choice',
        'text_en' => 'Does the business have a TIN?', 'text_bn' => 'ব্যবসার TIN আছে কি?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'available', 'label' => ['en' => 'Available', 'bn' => 'আছে']],
            ['value' => 'not_available', 'label' => ['en' => 'Not available', 'bn' => 'নেই']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 12
    ],
    [
        'id' => 'Q-CP-03', 'step' => 4, 'category' => 'compliance', 'answer_type' => 'single_choice',
        'text_en' => 'Does the business have a BIN?', 'text_bn' => 'ব্যবসার BIN আছে কি?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'available', 'label' => ['en' => 'Available', 'bn' => 'আছে']],
            ['value' => 'not_available', 'label' => ['en' => 'Not available', 'bn' => 'নেই']],
            ['value' => 'not_applicable', 'label' => ['en' => 'Not applicable', 'bn' => 'প্রযোজ্য নয়']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 13
    ],
    [
        'id' => 'Q-DB-01', 'step' => 5, 'category' => 'existing_debt', 'answer_type' => 'single_choice',
        'text_en' => 'Does the business have an existing business loan?', 'text_bn' => 'ব্যবসার কি বর্তমানে কোনো ব্যবসায়িক ঋণ আছে?',
        'help_en' => null, 'help_bn' => null, 'options' => $yesNo, 'prefill_from' => null, 'show_when' => null, 'sort_order' => 14
    ],
    [
        'id' => 'Q-DB-02', 'step' => 5, 'category' => 'existing_debt', 'answer_type' => 'currency',
        'text_en' => 'How much is still outstanding?', 'text_bn' => 'এখনো কত টাকা পরিশোধ বাকি?',
        'help_en' => null, 'help_bn' => null, 'options' => null, 'prefill_from' => null,
        'show_when' => ['questionId' => 'Q-DB-01', 'equals' => 'yes'], 'sort_order' => 15
    ],
    [
        'id' => 'Q-DB-03', 'step' => 5, 'category' => 'existing_debt', 'answer_type' => 'currency',
        'text_en' => 'What is the monthly repayment?', 'text_bn' => 'মাসিক কিস্তি কত?',
        'help_en' => null, 'help_bn' => null, 'options' => null, 'prefill_from' => null,
        'show_when' => ['questionId' => 'Q-DB-01', 'equals' => 'yes'], 'sort_order' => 16
    ],
    [
        'id' => 'Q-DB-04', 'step' => 5, 'category' => 'existing_debt', 'answer_type' => 'single_choice',
        'text_en' => 'How are repayments going?', 'text_bn' => 'কিস্তি পরিশোধ কেমন চলছে?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'on_time', 'label' => ['en' => 'On time', 'bn' => 'সময়মতো']],
            ['value' => 'sometimes_late', 'label' => ['en' => 'Sometimes late', 'bn' => 'মাঝে মাঝে দেরি হয়']],
            ['value' => 'overdue', 'label' => ['en' => 'Overdue', 'bn' => 'বকেয়া পড়েছে']],
        ],
        'prefill_from' => null, 'show_when' => ['questionId' => 'Q-DB-01', 'equals' => 'yes'], 'sort_order' => 17
    ],
    [
        'id' => 'Q-FD-01', 'step' => 6, 'category' => 'funding_requirement', 'answer_type' => 'currency',
        'text_en' => 'How much funding do you need?', 'text_bn' => 'কত টাকার funding দরকার?',
        'help_en' => null, 'help_bn' => null, 'options' => null, 'prefill_from' => null, 'show_when' => null, 'sort_order' => 18
    ],
    [
        'id' => 'Q-FD-02', 'step' => 6, 'category' => 'funding_requirement', 'answer_type' => 'select',
        'text_en' => 'What is the funding for?', 'text_bn' => 'Funding কী কাজে লাগবে?',
        'help_en' => null, 'help_bn' => null, 'options' => $purposeOpts, 'prefill_from' => null, 'show_when' => null, 'sort_order' => 19
    ],
    [
        'id' => 'Q-FD-03', 'step' => 6, 'category' => 'funding_requirement', 'answer_type' => 'single_choice',
        'text_en' => 'When do you need the funding?', 'text_bn' => 'Funding কবে দরকার?',
        'help_en' => null, 'help_bn' => null,
        'options' => [
            ['value' => 'within_1m', 'label' => ['en' => 'Within a month', 'bn' => 'এক মাসের মধ্যে']],
            ['value' => '1_3m', 'label' => ['en' => 'In 1–3 months', 'bn' => '১–৩ মাসের মধ্যে']],
            ['value' => '3_6m', 'label' => ['en' => 'In 3–6 months', 'bn' => '৩–৬ মাসের মধ্যে']],
            ['value' => 'later', 'label' => ['en' => 'Later than 6 months', 'bn' => '৬ মাসের পরে']],
        ],
        'prefill_from' => null, 'show_when' => null, 'sort_order' => 20
    ],
];

foreach ($questions as $q) {
    $opts = $q['options'] !== null ? json_encode($q['options'], JSON_UNESCAPED_UNICODE) : null;
    $sw = $q['show_when'] !== null ? json_encode($q['show_when'], JSON_UNESCAPED_UNICODE) : null;
    $args = [
        $q['id'], $q['step'], $q['category'], $q['answer_type'],
        $q['text_en'], $q['text_bn'], $q['help_en'], $q['help_bn'],
        $opts, 1, $q['prefill_from'], $sw, null, null, 1, $q['sort_order'], $now, $now
    ];
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $pdo->prepare('INSERT OR REPLACE INTO questions (id, step, category, answer_type, text_en, text_bn, help_en, help_bn, options_json, required, prefill_from, show_when_json, weight, rule_ref, active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute($args);
    } else {
        $pdo->prepare('INSERT INTO questions (id, step, category, answer_type, text_en, text_bn, help_en, help_bn, options_json, required, prefill_from, show_when_json, weight, rule_ref, active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE step = VALUES(step), category = VALUES(category), answer_type = VALUES(answer_type), text_en = VALUES(text_en), text_bn = VALUES(text_bn), help_en = VALUES(help_en), help_bn = VALUES(help_bn), options_json = VALUES(options_json), required = VALUES(required), prefill_from = VALUES(prefill_from), show_when_json = VALUES(show_when_json), sort_order = VALUES(sort_order), updated_at = VALUES(updated_at)')->execute($args);
    }
}
echo "Questions seeded: " . count($questions) . "\n";
