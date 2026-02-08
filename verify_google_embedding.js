const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verifyEmbedding() {
    const key = process.env.GOOGLE_API_KEY;
    console.log(`Testing API Key: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);

    if (!key) {
        console.error("Error: GOOGLE_API_KEY not found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const modelName = "text-embedding-004";
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        console.log(`Attempting to embed with '${modelName}'...`);
        const text = "University fees and admission requirements.";
        const result = await model.embedContent(text);

        const vector = result.embedding.values;
        console.log(`SUCCESS! Generated vector with length: ${vector.length}`);
        console.log("Sample (first 5):", vector.slice(0, 5));

    } catch (error) {
        console.error("FAILED to generate embedding.");
        console.error("Error details:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
        }
    }
}

verifyEmbedding();
