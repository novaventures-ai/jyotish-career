import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

export default async function handler(req: any, res: any) {
    try {
        const db = await getDb();
        if (!db) {
            return res.status(500).json({ status: "error", message: "Database not available" });
        }
        
        // Execute a simple query to keep the connection active for Supabase
        await db.execute(sql`SELECT 1`);
        
        return res.status(200).json({ 
            status: "ok", 
            message: "Supabase keep-alive ping successful",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Keep-alive ping failed:", error);
        return res.status(500).json({ status: "error", message: "Failed to ping database" });
    }
}
