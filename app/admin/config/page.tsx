"use client";

import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';

export default function ConfigPage() {
    const [config, setConfig] = useState({
        model_name: "gemini-1.5-flash",
        temperature: 0.7,
        system_prompt: ""
    });
    const [status, setStatus] = useState("");

    useEffect(() => {
        // Fetch current config on load
        fetch('http://localhost:8000/api/v1/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        setStatus("Saving...");
        try {
            const res = await fetch('http://localhost:8000/api/v1/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) setStatus("Saved successfully!");
            else setStatus("Error saving.");
        } catch (e) {
            setStatus("Error saving.");
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 p-8">
            <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Model Configuration</h1>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                        <select
                            className="w-full border rounded-md p-2 bg-white"
                            value={config.model_name}
                            onChange={e => setConfig({ ...config, model_name: e.target.value })}
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature: {config.temperature}
                        </label>
                        <input
                            type="range" min="0" max="1" step="0.1"
                            className="w-full"
                            value={config.temperature}
                            onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Controls randomness (0 = strict, 1 = creative)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                        <textarea
                            className="w-full border rounded-md p-2 h-32"
                            value={config.system_prompt}
                            onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-8">
                        <span className="text-green-600 font-medium">{status}</span>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
