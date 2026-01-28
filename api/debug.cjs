const fs = require('fs');
const path = require('path');

module.exports = function (req, res) {
    try {
        const root = process.cwd();
        const listing = {};
        listing.cwd = root;
        listing.rootFiles = fs.readdirSync(root);

        const distServerPath = path.join(root, 'dist-server');
        if (fs.existsSync(distServerPath)) {
            listing.distServerFiles = fs.readdirSync(distServerPath);
        } else {
            listing.distServerFiles = "MISSING";
        }

        res.json(listing);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
};
