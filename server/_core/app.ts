console.log('[App] Starting initialization (MINIMAL via SERVER)...');
import express from "express";
import { status } from "./minimal_status"; // Transitive import check

export const app = express();

app.use(express.json());

app.get("/api/test/minimal", (req, res) => {
    res.json({ status: status, timestamp: new Date().toISOString() });
});

console.log('[App] Initialization complete (MINIMAL via SERVER)');

export default app;
