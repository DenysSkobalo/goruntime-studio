import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', 'dist', '.git', '.svelte-kit'].includes(file)) {
        getFiles(filePath, files);
      }
    } else if (/\.(ts|svelte|js)$/.test(file)) {
      files.push(filePath);
    }
  }
  return files;
}

const anchorRegex = /ANCHOR:\s*([A-Z0-9_]+)/g;
const anchors = new Map();
let hasDuplicates = false;

for (const filePath of getFiles('./src')) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let match;
  while ((match = anchorRegex.exec(content)) !== null) {
    const tag = match[1];
    if (anchors.has(tag)) {
      console.error(`[-] Duplicate ANCHOR: "${tag}" found in ${filePath} and ${anchors.get(tag)}`);
      hasDuplicates = true;
    } else {
      anchors.set(tag, filePath);
    }
  }
}

if (hasDuplicates) {
  process.exit(1);
} else {
  console.log(`[+] All ${anchors.size} ANCHOR tags are unique.`);
}
