const fs = require('fs');
const csv = fs.readFileSync('public/bluehands_jobs_normalized_v4.csv', 'utf-8');
const lines = csv.trim().split('\n').slice(1);

const items = lines.map(line => {
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  parts.push(current.trim());
  return { jobId: parts[0], nameNorm: parts[2], system: parts[3], workType: parts[9] };
});

const entries = items.map(i => {
  const name = i.nameNorm.replace(/'/g, "\\'");
  return `  { jobId: '${i.jobId}', name: '${name}', system: '${i.system}', workType: '${i.workType}' },`;
}).join('\n');

const promptLines = items.map(i => `${i.jobId}: ${i.nameNorm}`).join('\n');

console.log('// ENTRIES:');
console.log(entries);
console.log('\n// PROMPT:');
console.log(promptLines);
