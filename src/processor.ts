// The Frappe-Gantt library expects dates in 'YYYY-MM-DD' format.
export type GanttTask = {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string;
    custom_class?: string; // For styling open/closed issues
};

export type ProcessedIssues = {
    ganttTasks: GanttTask[];
    unstartedIssues: any[]; // We can just pass the raw issue object
};

// Normalized names for "In Progress" status. Case-insensitive.
const IN_PROGRESS_STATUSES = ['in progress', 'doing', 'wip'];

function formatDate(date: Date): string {
    // Formats a Date object into 'YYYY-MM-DD'
    return date.toISOString().split('T')[0];
}

function getTodayInLondon(): string {
    // Get today's date in YYYY-MM-DD format for the Europe/London timezone
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Europe/London',
    };
    // Use en-CA locale to get the YYYY-MM-DD format, which is YYYY-MM-DD.
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(new Date());
}

function findStartDate(issue: any, events: any[]): string | null {
    // Sort events by creation time to ensure we find the *first* match.
    const sortedEvents = events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const event of sortedEvents) {
        // Check for 'labeled' events that match our in-progress statuses
        if (event.event === 'labeled' && event.label && IN_PROGRESS_STATUSES.includes(event.label.name.toLowerCase())) {
            return formatDate(new Date(event.created_at));
        }
        // Check for project card moves into a column that matches our in-progress statuses
        if (event.event === 'moved_columns_in_project' && event.project_card && IN_PROGRESS_STATUSES.includes(event.project_card.column_name.toLowerCase())) {
             return formatDate(new Date(event.created_at));
        }
        // Note: ProjectV2 "Status" field changes are not reliably captured by the v3 REST Events API.
        // This implementation relies on labels or project column names as a proxy.
    }

    // Fallback rule: If the issue is closed but never had an "in progress" event, its start date is its creation date.
    if (issue.state === 'closed') {
        return formatDate(new Date(issue.created_at));
    }

    // If the issue is still open and was never in progress, it's unstarted.
    return null;
}

export function processIssues(issues: any[], eventsByIssue: Map<number, any[]>): ProcessedIssues {
    const ganttTasks: GanttTask[] = [];
    const unstartedIssues: any[] = [];
    const today = getTodayInLondon();

    for (const issue of issues) {
        const events = eventsByIssue.get(issue.number) || [];
        const startDate = findStartDate(issue, events);

        if (startDate) {
            // This issue has a timeline.
            const endDate = issue.closed_at ? formatDate(new Date(issue.closed_at)) : today;

            // Calculate progress. If open, it's 0. If closed, it's 100. A more complex calculation is possible but not required.
            const progress = issue.state === 'closed' ? 100 : 0;

            ganttTasks.push({
                id: String(issue.number), // Use issue number for ID to make dependencies easier
                name: issue.title,
                start: startDate,
                end: endDate,
                progress: progress,
                dependencies: '', // Placeholder for now
                custom_class: issue.state === 'closed' ? 'bar-closed' : 'bar-open',
            });
        } else {
            // This is an open issue that was never "in progress".
            unstartedIssues.push(issue);
        }
    }

    // Sort tasks by start date for a cleaner chart
    ganttTasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return { ganttTasks, unstartedIssues };
}
