// Builds the athkar pages (athkar/ and athkar/<category>/) from the app's own data, so people searching for
// «أذكار الصباح» etc. find the full text with sources, and the app with it.
// Usage: node tools/build-athkar-pages.mjs "<app repo>/public/assets/data/athkar.json"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const BASE = 'https://abdullahghoraba.github.io/al-uns-billah/';
const PLAY = 'https://play.google.com/store/apps/details?id=com.abdullahghoraba.muslimfriend';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const times = (n) => (n <= 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : n <= 10 ? `${n} مرات` : `${n} مرة`);
const src = (s) => data.refsAr.sources[s] ?? s;
const grade = (g) => (g ? data.refsAr.grades[g] ?? g : '');

// How people search for each list (said once, naturally, in the title and description).
const SEO = {
  morning: ['أذكار الصباح مكتوبة كاملة', 'أذكار الصباح مكتوبة كاملة بالتشكيل مع عدد كل ذكر وفضله ومصدره من القرآن والسنة الصحيحة: آية الكرسي، المعوذات، سيد الاستغفار، وأصبحنا وأصبح الملك لله.'],
  evening: ['أذكار المساء مكتوبة كاملة', 'أذكار المساء مكتوبة كاملة بالتشكيل مع عدد كل ذكر وفضله ومصدره: آية الكرسي، المعوذات، أمسينا وأمسى الملك لله، وسيد الاستغفار.'],
  sleep: ['أذكار النوم مكتوبة', 'أذكار النوم وأدعية قبل النوم مكتوبة من القرآن والسنة مع المصدر: آية الكرسي، خواتيم البقرة، باسمك اللهم أموت وأحيا.'],
  waking: ['أذكار الاستيقاظ من النوم', 'أذكار ودعاء الاستيقاظ من النوم مكتوبة مع المصدر: الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور.'],
  mosque: ['دعاء دخول المسجد والخروج منه', 'دعاء دخول المسجد والخروج منه مكتوبًا مع المصدر من السنة الصحيحة.'],
  'after-prayer': ['الأذكار بعد الصلاة', 'الأذكار بعد السلام من الصلاة المفروضة مكتوبة مع العدد والمصدر: أستغفر الله، اللهم أنت السلام، التسبيح والتحميد والتكبير.'],
  tasbih: ['أذكار التسبيح وفضلها', 'صيغ التسبيح والتحميد والتهليل مع فضلها وعددها ومصدرها من السنة الصحيحة.'],
  istighfar: ['صيغ الاستغفار وسيد الاستغفار', 'صيغ الاستغفار مكتوبة مع سيد الاستغفار وفضله ومصدره من السنة الصحيحة.'],
  dua: ['أدعية مختارة من القرآن والسنة', 'أدعية مختارة مكتوبة من القرآن الكريم والسنة الصحيحة مع المصدر.'],
  distress: ['دعاء الكرب والهم والحزن', 'أدعية الكرب والهم والحزن وتفريج الضيق مكتوبة من السنة الصحيحة مع المصدر.'],
  travel: ['دعاء السفر', 'دعاء السفر وأذكار الركوب مكتوبة مع المصدر من السنة الصحيحة.'],
  eating: ['أذكار الطعام ودعاء بعد الأكل', 'أذكار الطعام: التسمية قبل الأكل ودعاء بعد الطعام مكتوبة مع المصدر.'],
};

const css = (up) => `
  @font-face { font-family: 'Amiri'; src: url('${up}app/assets/fonts/Amiri-Regular.ttf') format('truetype'); font-display: swap; }
  :root { --bg: #f7f4ec; --card: #fff; --ink: #1d3b2f; --muted: #5d6f66; --accent: #1f6b4f; --soft: #e8f1ec; --line: #e7e0d2; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f1a15; --card: #17261f; --ink: #e8efe9; --muted: #a3b5ab; --accent: #4fb488; --soft: #1f3329; --line: #2b3a33; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: system-ui, "Segoe UI", Tahoma, sans-serif; line-height: 1.7; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 16px; }
  header.top { display: flex; align-items: center; gap: 12px; padding: 8px 0 4px; }
  header.top img { width: 44px; height: 44px; border-radius: 12px; }
  header.top a { color: var(--ink); text-decoration: none; font-weight: 700; }
  h1 { font-size: 1.7rem; margin: 12px 0 4px; }
  .lead { color: var(--muted); margin: 0 0 16px; }
  .get { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 20px; }
  .get a { flex: 1 1 200px; text-align: center; background: var(--accent); color: #fff; text-decoration: none; padding: 12px 16px; border-radius: 999px; font-weight: 600; }
  .get a.alt { background: transparent; color: var(--accent); border: 2px solid var(--accent); }
  article { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 18px; margin: 0 0 14px; }
  .dhikr { font-family: 'Amiri', serif; font-size: 1.45rem; line-height: 2.1; text-align: center; margin: 0 0 10px; overflow-wrap: anywhere; }
  .count { display: inline-block; background: var(--soft); color: var(--accent); border-radius: 999px; padding: 2px 12px; font-weight: 700; font-size: .9rem; }
  .virtue { margin: 10px 0 0; }
  .ref { color: var(--muted); font-size: .9rem; margin: 8px 0 0; }
  nav.cats { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0; }
  nav.cats a { background: var(--card); border: 1px solid var(--line); color: var(--ink); text-decoration: none; padding: 8px 14px; border-radius: 999px; }
  footer { color: var(--muted); font-size: .85rem; margin: 24px 0 8px; }
  footer a { color: var(--muted); }
  ul.list { padding: 0; list-style: none; }
  ul.list li a { display: block; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin: 0 0 10px; color: var(--ink); text-decoration: none; font-weight: 600; }
  ul.list li span { display: block; color: var(--muted); font-weight: 400; font-size: .9rem; }
`;

function page({ path, title, description, body, depth }) {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${BASE}${path}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${BASE}${path}">
  <meta property="og:image" content="${BASE}preview.png">
  <link rel="icon" href="${up}icon.png">
  <style>${css(up)}</style>
</head>
<body>
  <div class="wrap">
    <header class="top"><img src="${up}icon.png" alt=""><a href="${up}">الأُنس بالله · قرآن وأذكار</a></header>
${body}
    <footer>
      <p>من تطبيق <a href="${up}about/">الأُنس بالله</a> (الانس بالله، Al-Uns Billah): مصحف يسمع تلاوتك ويصحّحها، أذكار بعدّاد، حديث اليوم، ومواقيت الصلاة، بلا إعلانات.</p>
      <p>${esc(data.quranAttribution).replace('https://tanzil.net', '<a href="https://tanzil.net">tanzil.net</a>')}</p>
    </footer>
  </div>
</body>
</html>
`;
}

const get = (up, appRoute) => `    <div class="get">
      <a href="${PLAY}">للأندرويد: Google Play</a>
      <a class="alt" href="${up}app/${appRoute}">للآيفون: افتحها مع العدّاد</a>
    </div>`;

const cats = data.categories.filter((c) => data.items.some((i) => i.categoryId === c.id));
const urls = ['athkar/'];
for (const c of cats) {
  const items = data.items.filter((i) => i.categoryId === c.id);
  const [head, desc] = SEO[c.id] ?? [c.nameAr, `${c.nameAr} مكتوبة مع المصدر.`];
  const cards = items.map((i) => `    <article>
      <p class="dhikr">${esc(i.textAr)}</p>
      <span class="count">تُقال ${times(i.repeatCount ?? 1)}</span>
      ${i.virtueAr ? `<p class="virtue">${esc(i.virtueAr)}</p>` : ''}
      <p class="ref">المصدر: ${esc(src(i.sourceRef))}${i.grade ? ` · الدرجة: ${esc(grade(i.grade))}` : ''}</p>
    </article>`).join('\n');
  const others = cats.filter((o) => o.id !== c.id).map((o) => `<a href="../${o.id}/">${esc(o.nameAr)}</a>`).join('');
  const path = `athkar/${c.id}/`;
  urls.push(path);
  mkdirSync(join(site, path), { recursive: true });
  writeFileSync(join(site, path, 'index.html'), page({
    path, depth: 2,
    title: `${head} | الأُنس بالله`,
    description: desc,
    body: `    <h1>${esc(c.nameAr)}</h1>
    <p class="lead">${esc(desc)} في التطبيق تجدها مع عدّاد لكل ذكر وتذكير يومي.</p>
${get('../../', `category/${c.id}`)}
${cards}
${get('../../', `category/${c.id}`)}
    <nav class="cats" aria-label="أذكار أخرى">${others}</nav>`,
  }));
}
writeFileSync(join(site, 'athkar', 'index.html'), page({
  path: 'athkar/', depth: 1,
  title: 'الأذكار مكتوبة: أذكار الصباح والمساء والنوم وبعد الصلاة | الأُنس بالله',
  description: 'أذكار المسلم مكتوبة كاملة بالتشكيل مع العدد والفضل والمصدر: أذكار الصباح، أذكار المساء، أذكار النوم، الأذكار بعد الصلاة، الاستغفار، أدعية الكرب، دعاء السفر.',
  body: `    <h1>أذكار المسلم مكتوبة</h1>
    <p class="lead">كل ذكر بنصه كاملًا مع عدده وفضله ومصدره ودرجته. وفي تطبيق الأُنس بالله تجدها مع عدّاد وتذكير بأذكار الصباح والمساء.</p>
${get('../', '')}
    <ul class="list">
${cats.map((c) => `      <li><a href="${c.id}/">${esc(c.nameAr)}<span>${data.items.filter((i) => i.categoryId === c.id).length} ذكرًا</span></a></li>`).join('\n')}
    </ul>`,
}));
writeFileSync(join(site, 'tools', 'athkar-urls.json'), JSON.stringify(urls, null, 1) + '\n');
console.log(urls.length, 'pages');
