import { NextResponse } from 'next/server';
import * as lancedb from '@lancedb/lancedb';
import path from 'path';

// Reusing config from local-rag.ts implies we should probably export these constants or access via helper
// For now, duplicating the path logic to ensure independence in debug route
const DB_PATH = path.join(process.cwd(), '.lancedb');
const TABLE_NAME = 'university_docs_gemini_embed_001';

export async function GET() {
    try {
        const db = await lancedb.connect(DB_PATH);
        const tableNames = await db.tableNames();

        if (!tableNames.includes(TABLE_NAME)) {
            return NextResponse.json({ count: 0, rows: [], message: "Table not found (no data ingested yet)." });
        }

        const table = await db.openTable(TABLE_NAME);
        const count = await table.countRows();

        // LanceDB doesn't strictly support "last 10", but we can limit to 10.
        // In a real vector DB, "last" is relative. We'll just grab 10.
        const rows = await table.query()
            .limit(10)
            .toArray();

        // Simplify for display
        const displayRows = rows.map((r: any) => ({
            id: r.id,
            filename: r.filename,
            text_preview: (r.text as string).substring(0, 80) + "...",
            created_at: r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'
        }));

        return NextResponse.json({
            count,
            rows: displayRows
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const db = await lancedb.connect(DB_PATH);
        const tableNames = await db.tableNames();

        if (tableNames.includes(TABLE_NAME)) {
            await db.dropTable(TABLE_NAME);
            return NextResponse.json({ message: "Table cleared successfully." });
        } else {
            return NextResponse.json({ message: "Table does not exist." });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
