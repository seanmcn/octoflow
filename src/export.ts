import html2canvas from 'html2canvas';
import { GanttTask } from './processor';

function escapeCSVField(field: any): string {
    const stringField = String(field);
    // If the field contains a comma, double quote, or newline, enclose it in double quotes.
    if (/[",\n]/.test(stringField)) {
        // Escape existing double quotes by doubling them.
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

export function exportToCSV(tasks: GanttTask[]) {
    if (!tasks || tasks.length === 0) {
        alert("No data available to export. Please generate a chart first.");
        return;
    }

    const headers = ['ID', 'Title', 'Start Date', 'End Date', 'Status'];
    const rows = tasks.map(task => [
        task.id,
        task.name,
        task.start,
        task.end,
        task.progress === 100 ? 'Closed' : 'Open'
    ]);

    let csvContent = headers.map(escapeCSVField).join(',') + "\r\n";
    rows.forEach(rowArray => {
        const row = rowArray.map(escapeCSVField).join(',');
        csvContent += row + "\r\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "gantt-export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function exportToPNG() {
    const chartElement = document.getElementById('gantt-chart-container');
    if (!chartElement || !chartElement.querySelector('#gantt svg')) {
        alert("No chart available to export. Please generate a chart first.");
        return;
    }

    // Temporarily set a specific width to ensure the full chart is captured
    const originalWidth = chartElement.style.width;
    const svgElement = chartElement.querySelector('#gantt svg') as SVGSVGElement;
    const svgWidth = svgElement.getBoundingClientRect().width;
    chartElement.style.width = `${svgWidth}px`;


    try {
        const canvas = await html2canvas(chartElement, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#242424', // Match the app's background
            logging: false
        });
        const imageURL = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'gantt-chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to export PNG:', error);
        alert('Could not export chart as PNG. See console for details.');
    } finally {
        // Restore original width
        chartElement.style.width = originalWidth;
    }
}
