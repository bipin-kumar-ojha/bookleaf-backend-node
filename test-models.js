require('dotenv').config();

async function checkAvailableModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Aapki API key in models ko support karti hai:");
      data.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .forEach(m => console.log(m.name));
    } else {
      console.log("Error API Key ya response mein:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

checkAvailableModels();