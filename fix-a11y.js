const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function fixA11y(filePath) {
    if (!filePath.endsWith('.html')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Regex to find elements with (click) but without tabindex or (keydown.enter)
    // It's a bit naive but works for a quick fix
    const regex = /<([a-zA-Z0-9-]+)([^>]*?\s\(click\)="[^"]*"[^>]*?)>/g;
    
    content = content.replace(regex, (match, tag, attrs) => {
        // skip naturally focusable elements
        if (['button', 'a', 'input', 'select', 'textarea'].includes(tag.toLowerCase())) {
            return match;
        }
        
        let newAttrs = attrs;
        if (!attrs.includes('tabindex=')) {
            newAttrs += ' tabindex="0"';
        }
        if (!attrs.includes('(keydown.enter)=')) {
            // grab the click handler
            const clickMatch = attrs.match(/\(click\)="([^"]*)"/);
            if (clickMatch) {
                newAttrs += ` (keydown.enter)="${clickMatch[1]}"`;
            }
        }
        
        return `<${tag}${newAttrs}>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed A11y in ${filePath}`);
    }
}

walkDir('./src/app', fixA11y);
console.log('A11y fix pass complete.');
