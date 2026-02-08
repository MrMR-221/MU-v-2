const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("No API Key found!");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    try {
        console.log("Listing available models...");
        // Note: SDK doesn't always expose listModels directly easily in all versions, 
        // but let's try to infer availability by trying standard ones.
        // Actually, we can use the model's `getGenerativeModel` to test.

        const candidates = [
            "text-embedding-004",
            "models/text-embedding-004",
            "embedding-001",
            "models/embedding-001"
        ];

        for (const modelName of candidates) {
            try {
                process.stdout.write(`Testing ${modelName}... `);
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.embedContent("Hello world");
                console.log("✅ AVAILABLE");
            } catch (e) {
                console.log(`❌ FAILED (${e.message.split(':')[0]})`);
            }
        }

    } catch (e) {
        console.error("Fatal error:", e);
    }
}

listModels();
