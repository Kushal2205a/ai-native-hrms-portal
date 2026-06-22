export type NameMatchResult = {
    match: boolean;
    likely: boolean;
    method: string;
};

export type VerificationResult = {
    profile_name: string;
    resume_name: string;
    resume_name_match: boolean;
    verification_status: 'verified' | 'needs_review' | 'mismatch';
    linkedin_url_found: boolean;
    linkedin_url_valid: boolean;
    verification_notes: string[];
};

const LINKEDIN_URL_PATTERN =
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[.,\-']/g, '')
        .replace(/\s+/g, ' ');
}

export function fuzzyNameMatch(
    profileName: string,
    resumeName: string
): NameMatchResult {
    const normProfile = normalizeName(profileName);
    const normResume = normalizeName(resumeName);

    if (normProfile === normResume) {
        return { match: true, likely: true, method: 'exact' };
    }

    const profileTokens = normProfile.split(' ').filter(Boolean);
    const resumeTokens = normResume.split(' ').filter(Boolean);

    if (profileTokens.length === 0 || resumeTokens.length === 0) {
        return { match: false, likely: false, method: 'empty' };
    }

    const isSubset = (smaller: string[], larger: string[]): boolean =>
        smaller.every((token) => larger.includes(token));

    if (isSubset(resumeTokens, profileTokens)) {
        return {
            match: false,
            likely: true,
            method: 'subset',
        };
    }

    if (isSubset(profileTokens, resumeTokens)) {
        return {
            match: false,
            likely: true,
            method: 'subset',
        };
    }

    return { match: false, likely: false, method: 'none' };
}

export function validateLinkedInUrl(
    url: string | null
): { found: boolean; valid: boolean } {
    if (!url || !url.trim()) {
        return { found: false, valid: false };
    }

    return {
        found: true,
        valid: LINKEDIN_URL_PATTERN.test(url.trim()),
    };
}

export function verifyResume(
    profileName: string,
    resumeFullName: string | null,
    linkedinUrl: string | null,
    githubUrl: string | null,
    portfolioUrl: string | null
): VerificationResult {
    const notes: string[] = [];

    if (!resumeFullName) {
        return {
            profile_name: profileName,
            resume_name: '',
            resume_name_match: false,
            verification_status: 'needs_review',
            linkedin_url_found: false,
            linkedin_url_valid: false,
            verification_notes: ['Could not extract name from resume.'],
        };
    }

    const nameResult = fuzzyNameMatch(profileName, resumeFullName);
    const linkedin = validateLinkedInUrl(linkedinUrl);

    if (linkedin.found && !linkedin.valid) {
        notes.push('LinkedIn URL appears to be malformed.');
    }

    let status: 'verified' | 'needs_review' | 'mismatch';
    if (nameResult.match || nameResult.likely) {
        status = 'verified';
    } else {
        status = 'mismatch';
        notes.push('Resume name does not match profile name.');
    }

    return {
        profile_name: profileName,
        resume_name: resumeFullName,
        resume_name_match: nameResult.match,
        verification_status: status,
        linkedin_url_found: linkedin.found,
        linkedin_url_valid: linkedin.valid,
        verification_notes: notes,
    };
}
