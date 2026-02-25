const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'views');
let updatedCount = 0;
fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.ejs')) {
        let filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/<meta name="viewport" content="width=device-width, initial-scale=1.0">/g, '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            updatedCount++;
            console.log(`Updated ${file}`);
        }
    }
});
console.log(`Updated ${updatedCount} files.`);
