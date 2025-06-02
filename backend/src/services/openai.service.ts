import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DupeAnalysis {
  similarityScore: number;
  priceAnalysis: string;
  recommendedStatus: 'approve' | 'reject' | 'review';
  reasoning: string;
}

interface DupeSuggestion {
  title: string;
  retailer: string;
  price: string;
  description: string;
  productLink: string;
}

export async function analyzeDupeSubmission(
  originalProduct: string,
  dupeProduct: string,
  priceComparison: string,
  similarityReason: string
): Promise<DupeAnalysis> {
  try {
    const prompt = `
      Please analyze this fashion dupe submission:
      
      Original Product: ${originalProduct}
      Dupe Product: ${dupeProduct}
      Price Comparison: ${priceComparison}
      User's Similarity Reasoning: ${similarityReason}

      Please provide a detailed analysis in the following JSON format:
      {
        "similarityScore": (number between 0-100),
        "priceAnalysis": "brief analysis of the price comparison",
        "recommendedStatus": "approve" or "reject" or "review",
        "reasoning": "detailed explanation for the recommendation"
      }

      Consider factors like:
      - Price difference reasonableness
      - Similarity in design and features
      - Quality comparison
      - Potential trademark/copyright issues
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a fashion expert AI assistant that specializes in analyzing fashion dupes (similar products at different price points). Your goal is to help verify the legitimacy and quality of dupe submissions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const analysis = JSON.parse(content);
    return analysis as DupeAnalysis;
  } catch (error) {
    console.error('Error analyzing dupe submission:', error);
    throw error;
  }
}

export async function findDupes(luxuryItem: string): Promise<DupeSuggestion[]> {
  try {
    const prompt = `
You are a fashion stylist who finds realistic, affordable lookalikes for expensive clothing.

The user is looking for affordable dupes of: "${luxuryItem}"

Give 3 options from stores like H&M, Zara, ASOS, or Forever 21.

For each, include:
- title
- retailer
- price
- description (focus on materials, construction, fit)
- a realistic but fake product link

Respond in valid JSON format as a list.
`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist that generates realistic dupes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo", // You can change this to "gpt-4" if you have access
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsedContent = JSON.parse(content);
    return Array.isArray(parsedContent) ? parsedContent : parsedContent.dupes || [];
  } catch (error) {
    console.error('Error finding dupes:', error);
    throw error;
  }
}

// Function to get more detailed analysis of a specific dupe
export async function analyzeDupePair(
  originalProduct: string,
  dupeProduct: string
): Promise<{
  comparisonPoints: string[];
  qualityAssessment: string;
  valueRating: number;
  stylingTips: string[];
}> {
  try {
    const prompt = `
      Compare these two fashion items in detail:
      
      Original: ${originalProduct}
      Dupe: ${dupeProduct}
      
      Provide a detailed analysis in the following JSON format:
      {
        "comparisonPoints": ["list specific points of comparison"],
        "qualityAssessment": "detailed assessment of quality differences",
        "valueRating": "number 1-10 representing value for money",
        "stylingTips": ["list of styling suggestions that work for both items"]
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a fashion expert AI assistant that specializes in detailed product comparisons and styling advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing dupe pair:', error);
    throw error;
  }
} 