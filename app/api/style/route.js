import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LISA_PROFILE = `
You are Lisa's personal stylist. Lisa is a 5'2" Nigerian woman living in Dublin with a pear/hourglass figure (34-26-38) and deep warm dark chocolate skin with warm undertones.

Her power colours: Emerald green (absolute best), purple/plum/burgundy, teal, fuchsia, baby pink, bright yellow, crisp white, black.
Safe neutrals: Cream, camel, chocolate brown, olive.
AVOID: Muted pastels, plain grey, beige alone — these wash her out. She needs SATURATED colour.

Silhouette rules: Fitted waist pieces always. High-waisted wide-leg trousers elongate her frame. Tuck tops. Midi bodycon dresses are stunning. A-line skirts with fitted tops. Structured over oversized. Cropped jackets for her petite frame.

Her style DNA: Tonal dressing, cardigans worn as tops buttoned and tucked, statement belts to define waist, structured leather bags in cream/tan/cognac, gold jewellery (layered delicate necklaces, small hoops), pointed-toe shoes, woven ballet flats.
`;

export async function POST(req) {
  try {
    const { description, imageBase64, weather } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${LISA_PROFILE}

${weather ? `Today's weather: ${weather}` : ''}

${imageBase64 ? 'Lisa has shared a photo of a clothing item or outfit.' : ''}
${description ? `She describes: "${description}"` : ''}

Create 3 distinct styled looks using this as the starting point. Each look should feel like a real outfit she can wear today in Dublin.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "looks": [
    {
      "title": "Look name (2-4 words, evocative)",
      "description": "2-3 sentences describing the full look, the vibe, why it works on her specifically",
      "pieces": ["specific item to add 1", "specific item to add 2", "specific item to add 3", "shoes", "bag or accessory"]
    }
  ]
}`;

    let result;
    if (imageBase64) {
      result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Styling failed' }, { status: 500 });
  }
}
