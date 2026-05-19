'use server';

import { generateRequestDraft } from '@/lib/ai/requestDrafting';

type ActionState =
  | {
      success: true;
      draft: Awaited<ReturnType<typeof generateRequestDraft>>;
      message: string;
    }
  | {
      success: false;
      draft: null;
      message: string;
    };

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export async function draftEmployeeRequest(
  formData: FormData
): Promise<ActionState> {
  const roughText = getStringValue(formData, 'rough_text');
  const selectedRequestType = getStringValue(formData, 'selected_request_type');

  if (!roughText || roughText.length < 5) {
    return {
      success: false,
      draft: null,
      message: 'Describe your request in a little more detail.',
    };
  }

  const draft = await generateRequestDraft({
    rough_text: roughText,
    selected_request_type: selectedRequestType || undefined,
  });

  return {
    success: true,
    draft,
    message: 'Draft generated. Review it before submitting.',
  };
}