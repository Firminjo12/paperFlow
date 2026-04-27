const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const p = path.join(dir, file);
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('link.click()')) {
            console.log(`\n--- ${file} : L${i+1} ---`);
            const start = Math.max(0, i - 4);
            const end = Math.min(lines.length, i + 5);
            console.log(lines.slice(start, end).join('\n'));
        }
    });
});
