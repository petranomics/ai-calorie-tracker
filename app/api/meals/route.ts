import { OpenAIService } from '@/lib/openai';
import { NextResponse } from 'next/server';

const MAX_DESCRIPTION_LEN = 2000;
const MAX_PROMPT_LEN = 4000;

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('X-OpenAI-Key');
    const model = request.headers.get('X-OpenAI-Model') || 'gpt-4o-mini';
    const debug = request.headers.get('X-Debug-Mode') === 'true';
    const textAnalysisPrompt = request.headers.get('X-Text-Analysis-Prompt');

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 401 });
    }

    if (textAnalysisPrompt && textAnalysisPrompt.length > MAX_PROMPT_LEN) {
      return NextResponse.json({ error: 'Custom prompt is too long' }, { status: 413 });
    }

    const { description } = await request.json();
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Meal description is required' }, { status: 400 });
    }

    if (description.length > MAX_DESCRIPTION_LEN) {
      return NextResponse.json({ error: 'Description too long' }, { status: 413 });
    }

    const openAIService = new OpenAIService({
      apiKey,
      model,
      debug,
      textAnalysisPrompt: textAnalysisPrompt || undefined,
    });
    const result = await openAIService.analyzeFoodData(description);

    return NextResponse.json({
      message: 'Meal analyzed successfully',
      nutritionData: result.data,
      debugInfo: result.debugInfo,
    });
  } catch (error) {
    console.error('Error processing meal:', error);
    return NextResponse.json({ error: 'Failed to process meal' }, { status: 500 });
  }
}
