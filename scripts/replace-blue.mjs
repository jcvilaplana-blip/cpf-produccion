import { readFileSync, writeFileSync } from 'fs';

const files = [
  'components/candidates-browser.tsx',
  'app/businesses/page.tsx',
];

for (const file of files) {
  const path = `/vercel/share/v0-project/${file}`;
  let content = readFileSync(path, 'utf8');
  const original = content;
  content = content.replaceAll('#1d7ab0', '#018F86');
  if (content !== original) {
    writeFileSync(path, content, 'utf8');
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
}
console.log('Done!');
