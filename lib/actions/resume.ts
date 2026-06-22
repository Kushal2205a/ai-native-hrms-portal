'use server';

import { extractText, getDocumentProxy } from 'unpdf';
import { parseResumeWithAI } from '@/lib/ai/resume-parser';
import { verifyResume } from '@/lib/ai/resume-verifier';
import { createClient } from '@/lib/supabase/server';

export async function uploadAndParseResume(formData: FormData) {
    const file = formData.get('resume') as File;

    if (!file) {
        throw new Error('Resume file is required.');
    }

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('You must be logged in to upload a resume.');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    if (!profile?.full_name) {
        throw new Error('Complete your profile name before uploading a resume.');
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await getDocumentProxy(
        new Uint8Array(arrayBuffer)
    );

    const { text } = await extractText(pdf);
    const resumeText = text.join('\n');

    const parsedData = await parseResumeWithAI(resumeText);

    const verification = verifyResume(
        profile.full_name,
        parsedData.full_name,
        parsedData.linkedin_url,
        parsedData.github_url,
        parsedData.portfolio_url
    );

    return {
        success: true,
        resumeText,
        parsedData,
        verification,
    };
}