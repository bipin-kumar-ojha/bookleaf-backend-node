const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateTicketAnalysis = async ({ subject, description }) => {
  const prompt = `
    You are an AI assistant for BookLeaf Publishing support.
    Knowledge Base Policies:
- Royalties: 80/20 split (80% to author). Paid quarterly within 45 days. Minimum payout threshold is ₹1,000.
- ISBN: Unique assigned by BookLeaf. ISBN errors are high-priority issues.
- Printing: Standard 5-7 business days. For defective copies, ask for photos and offer free reprint.
- Distribution: Amazon India, Flipkart, US, UK. Stock sync issues take 24-48 hours.
- Tone: Empathetic, professional. Use specific numbers/dates. Own up to faults. Give clear next steps.

    Analyze this author ticket:
    Subject: ${subject}
    Description: ${description}

    Respond ONLY with a valid JSON object containing exactly these three keys:
- "category": (choose exactly one: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, Legal & Copyright, Marketing & Promotions, Formatting Issues, General Inquiry)
- "priority": (choose exactly one: Critical, High, Medium, Low)
- "draftResponse": (A fully written, empathetic draft response to the author based on BookLeaf policies)
  `;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-6-luna',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI service returned an empty response');

  return JSON.parse(content);
};

module.exports = { generateTicketAnalysis };
