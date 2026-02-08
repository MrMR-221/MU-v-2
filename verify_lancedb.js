const lancedb = require('@lancedb/lancedb');
const path = require('path');

async function checkDB() {
    const dbPath = path.join(process.cwd(), '.lancedb');
    const tableName = 'university_docs_local';

    try {
        const db = await lancedb.connect(dbPath);
        const tableNames = await db.tableNames();
        console.log("Tables found:", tableNames);

        if (tableNames.includes(tableName)) {
            const table = await db.openTable(tableName);
            const count = await table.countRows();
            console.log(`SUCCESS: Table '${tableName}' exists.`);
            console.log(`ROW COUNT: ${count}`);

            if (count > 0) {
                const rows = await table.query().limit(1).execute();
                console.log("Sample Row:", JSON.stringify(rows[0], null, 2));
            }
        } else {
            console.log(`ERROR: Table '${tableName}' does NOT exist.`);
        }
    } catch (e) {
        console.error("Verification failed:", e);
    }
}

checkDB();
