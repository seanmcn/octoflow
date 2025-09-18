import { getAccessToken } from './auth';

const API_URL = 'https://api.github.com';

async function fetchPaginatedGitHubAPI(path: string, token: string | null): Promise<any[]> {
    if (!token) {
        throw new Error("Not authenticated. Please log in again.");
    }

    let results: any[] = [];
    let nextUrl: string | null = `${API_URL}${path}`;

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`GitHub API error: ${response.status} ${errorData.message}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            results = results.concat(data);
        } else {
            // Handle cases where the response is not an array (e.g., a single object)
            // This shouldn't happen for paginated endpoints but is a safeguard.
            results.push(data);
        }


        const linkHeader = response.headers.get('Link');
        nextUrl = null;
        if (linkHeader) {
            const links = linkHeader.split(',').reduce((acc, part) => {
                const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
                if (match) {
                    acc[match[2]] = match[1];
                }
                return acc;
            }, {} as Record<string, string>);

            if (links.next) {
                nextUrl = links.next;
            }
        }
    }

    return results;
}


export async function fetchIssues(owner: string, repo: string): Promise<any[]> {
    const token = getAccessToken();
    const path = `/repos/${owner}/${repo}/issues?state=all&per_page=100`;
    const issues = await fetchPaginatedGitHubAPI(path, token);

    // Filter out pull requests, which are returned by the issues endpoint
    return issues.filter((issue: any) => !issue.pull_request);
}

export async function fetchIssueEvents(owner: string, repo: string, issueNumber: number): Promise<any[]> {
    const token = getAccessToken();
    const path = `/repos/${owner}/${repo}/issues/${issueNumber}/events?per_page=100`;
    return await fetchPaginatedGitHubAPI(path, token);
}
