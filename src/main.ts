import './style.css'
import 'frappe-gantt/dist/frappe-gantt.css';
import { handleAuthCallback, redirectToGitHubAuth, isAuthenticated } from './auth';
import { fetchIssues, fetchIssueEvents } from './github';
import { processIssues, GanttTask } from './processor';
import { exportToCSV, exportToPNG } from './export';
import Gantt from 'frappe-gantt';

const app = document.querySelector<HTMLDivElement>('#app')!;

let currentGanttTasks: GanttTask[] = [];

async function render() {
  try {
    const loggedIn = await handleAuthCallback();
    window.history.replaceState({}, document.title, window.location.pathname);

    if (loggedIn || isAuthenticated()) {
      renderApp();
    } else {
      renderLogin();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    renderLogin((error as Error).message);
  }
}

function renderLogin(error?: string) {
  app.innerHTML = `
    <div>
      <h1>GitHub Issues Gantt Chart</h1>
      <p>Log in with your GitHub account to fetch issue data from a private repository.</p>
      <button id="login-button">Login with GitHub</button>
      ${error ? `<p class="error">${error}</p>` : ''}
    </div>
  `;
  document.getElementById('login-button')?.addEventListener('click', redirectToGitHubAuth);
}

function renderApp() {
  app.innerHTML = `
    <div>
      <h1>GitHub Issues Gantt Chart</h1>
      <p>Enter a repository you have access to and click "Generate" to see the Gantt chart.</p>

      <div class="controls">
        <input type="text" id="repo-input" placeholder="owner/repository" />
        <button id="generate-button">Generate Chart</button>
      </div>

      <div id="gantt-chart-container" class="gantt-container">
        <svg id="gantt"></svg>
      </div>

      <div id="unstarted-issues-container">
        <h2>Unstarted Issues</h2>
        <ul id="unstarted-issues-list">
        </ul>
      </div>

      <div class="export-buttons">
        <button id="export-csv-button">Export to CSV</button>
        <button id="export-png-button">Export to PNG</button>
      </div>
    </div>
  `;

  document.getElementById('generate-button')?.addEventListener('click', handleGenerateChart);
  document.getElementById('export-csv-button')?.addEventListener('click', () => exportToCSV(currentGanttTasks));
  document.getElementById('export-png-button')?.addEventListener('click', exportToPNG);
}

async function handleGenerateChart() {
    const repoInput = document.getElementById('repo-input') as HTMLInputElement;
    const repo = repoInput.value.trim();
    if (!repo || !repo.includes('/')) {
        alert('Please enter a valid repository in the format "owner/repository".');
        return;
    }

    const [owner, repoName] = repo.split('/');
    const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
    const ganttContainer = document.getElementById('gantt-chart-container')!;
    const unstartedList = document.getElementById('unstarted-issues-list')!;

    let gantt: Gantt | null = null;
    currentGanttTasks = []; // Clear previous data

    try {
        generateButton.disabled = true;
        generateButton.textContent = 'Loading...';
        ganttContainer.innerHTML = '<svg id="gantt"></svg>'; // Clear previous chart
        unstartedList.innerHTML = '<li>Loading...</li>';

        const issues = await fetchIssues(owner, repoName);
        if (issues.length === 0) {
            ganttContainer.innerHTML = '<p>No issues found in this repository.</p>';
            unstartedList.innerHTML = '';
            return;
        }

        const eventPromises = issues.map(issue => fetchIssueEvents(owner, repoName, issue.number));
        const eventsForAllIssues = await Promise.all(eventPromises);

        const eventsByIssue = new Map<number, any[]>();
        issues.forEach((issue, index) => {
            eventsByIssue.set(issue.number, eventsForAllIssues[index]);
        });

        const { ganttTasks, unstartedIssues } = processIssues(issues, eventsByIssue);
        currentGanttTasks = ganttTasks; // Store for export

        if (ganttTasks.length > 0) {
            gantt = new Gantt("#gantt", ganttTasks, {
                custom_popup_html: (task: GanttTask) => {
                    return `
                        <div class="gantt-popup">
                            <strong>${task.name}</strong>
                            <p>Start: ${task.start}</p>
                            <p>End: ${task.end}</p>
                            <p>Status: ${task.progress === 100 ? 'Closed' : 'Open'}</p>
                        </div>
                    `;
                }
            });
        } else {
            ganttContainer.innerHTML = '<p>No issues with a defined timeline found.</p>';
        }

        if (unstartedIssues.length > 0) {
            unstartedList.innerHTML = unstartedIssues.map(issue => `<li><a href="${issue.html_url}" target="_blank">#${issue.number}</a> - ${issue.title}</li>`).join('');
        } else {
            unstartedList.innerHTML = '<li>No unstarted issues found.</li>';
        }

    } catch (error) {
        console.error('Failed to generate chart:', error);
        ganttContainer.innerHTML = `<p class="error">Failed to load chart data: ${(error as Error).message}</p>`;
        unstartedList.innerHTML = '';
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Chart';
    }
}

render();
