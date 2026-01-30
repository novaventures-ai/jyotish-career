
const path = require('path');
const fs = require('fs');

async function validate() {
    try {
        const bundlePath = path.resolve('./api/_lib/bundled_app.js');
        if (!fs.existsSync(bundlePath)) {
            throw new Error('Bundle file not found at ' + bundlePath);
        }
        console.log('Loading bundle from:', bundlePath);
        await import('file://' + bundlePath);
        console.log('✅ Bundle loaded successfully');
    } catch (e) {
        console.error('❌ Bundle failed to load');
        console.error(e);
        process.exit(1);
    }
}

validate();
