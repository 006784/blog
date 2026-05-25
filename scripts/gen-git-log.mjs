#!/usr/bin/env node
// Pre-generate git commit log as static JSON before build.
// Reads the last 100 commits and writes to src/data/git-log.json.

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir  = join(__dirname, '../src/data');
const outFile = join(outDir, 'git-log.json');

let commits = [];
try {
  // Format: hash|ISO-date|subject|author
  const raw = execSync(
    'git log --max-count=100 --pretty=format:"%H|%aI|%s|%aN"',
    { cwd: join(__dirname, '..'), encoding: 'utf-8' }
  ).trim();

  commits = raw.split('\n').map((line) => {
    const [hash, date, message, author] = line.split('|');
    return { hash: hash?.slice(0, 7), date, message, author };
  }).filter((c) => c.hash && c.date && c.message);
} catch (e) {
  console.warn('[gen-git-log] git log failed, writing empty array:', e.message);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(commits, null, 2), 'utf-8');
console.log(`[gen-git-log] wrote ${commits.length} commits → ${outFile}`);
