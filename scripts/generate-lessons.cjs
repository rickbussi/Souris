const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const markdown = fs.readFileSync(path.join(root, 'content', 'Tutoriel.md'), 'utf8');
const matches = [...markdown.matchAll(/^# ([^\r\n]+)\r?\n/gm)];
const sections = matches.map((match, index) => ({
  title: match[1],
  markdown: markdown.slice(match.index + match[0].length,
    index + 1 < matches.length ? matches[index + 1].index : markdown.length).trim()
}));
if (sections.length !== 6) throw new Error('Le tutoriel doit contenir six sections.');
fs.writeFileSync(path.join(root, 'src', 'app', 'lessons.ts'),
  `// Généré depuis content/Tutoriel.md.\nexport const lessons: ReadonlyArray<{ title: string; markdown: string }> = ${JSON.stringify(sections, null, 2)};\n`);
