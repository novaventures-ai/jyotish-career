import fs from 'fs';
import path from 'path';

export default function (req, res) {
    try {
        // Attempt to read api/index.js
        const root = process.cwd();
        const filePath = path.join(root, 'api', 'index.js');
        const content = fs.readFileSync(filePath, 'utf8');
        res.status(200).send(content);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
}
