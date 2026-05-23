import { OpenAIService } from '@/lib/openai';
import { NextResponse } from 'next/server';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_PROMPT_LEN = 4000;

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('X-OpenAI-Key');
    const model = request.headers.get('X-OpenAI-Model') || 'gpt-4o-mini';
    const debug = request.headers.get('X-Debug-Mode') === 'true';
    const imageAnalysisPrompt = request.headers.get('X-Image-Analysis-Prompt');

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 401 });
    }

    if (imageAnalysisPrompt && imageAnalysisPrompt.length > MAX_PROMPT_LEN) {
      return NextResponse.json({ error: 'Custom prompt is too long' }, { status: 413 });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength && contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const description = formData.get('description') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 });
    }

    if (description && description.length > MAX_DESCRIPTION_LEN) {
      return NextResponse.json({ error: 'Description too long' }, { status: 413 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const openAIService = new OpenAIService({
      apiKey,
      model,
      debug,
      imageAnalysisPrompt: imageAnalysisPrompt || undefined,
    });

    const result = await openAIService.analyzeImageData(base64Image, description || undefined);
    return NextResponse.json({
      message: 'Image analyzed successfully',
      nutritionData: result.data,
      debugInfo: result.debugInfo,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
