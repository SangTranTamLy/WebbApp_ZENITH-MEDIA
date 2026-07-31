const fs = require('fs');
const file = process.argv[2];
const start = parseInt(process.argv[3]) - 1;
const end = parseInt(process.argv[4]) - 1;

let lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(start, end - start + 1);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log(`Deleted lines ${start+1} to ${end+1} in ${file}`);
