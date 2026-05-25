'use server';

import { extractText, getDocumentProxy } from 'unpdf';
import { parseResumeWithAI } from '@/lib/ai/resume-parser';
import { createClient } from '@/lib/supabase/server';

export async function uploadAndParseResume(formData: FormData) {
    const file = formData.get('resume') as File;

    if (!file) {
        throw new Error('Resume file is required.');
    }

    const supabase = await createClient();

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await getDocumentProxy(
        new Uint8Array(arrayBuffer)
    );

    const { text } = await extractText(pdf);
    const resumeText = text.join('\n');

    const parsedData = await parseResumeWithAI(resumeText);
    return {
        success: true,
        resumeText,
        parsedData,
    };
}