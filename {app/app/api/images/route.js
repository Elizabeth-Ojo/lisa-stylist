import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(
      `Search online for this fashion product. Find a real product from a retailer like ASOS, Zara, H&M, Mango, COS, Nordstrom, & Other Stories, or similar.

Return a JSON object with:
- "imageUrl": a direct URL to the product image (must end in .jpg, .png, .webp, or be from a CDN)
- "productName": short product name
- "brand": the brand
- "price": the price as a string (include currency symbol), or "" if unknown
- "shopUrl": the URL to buy the product

Find the closest real match. Product: ${query}`
    );

    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (parsed.imageUrl) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "No product found" }, { status: 404 });
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
