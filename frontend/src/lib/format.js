const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(dateText) {
  if (!dateText) return '';

  // new Date('2025-04-12') means midnight UTC, which shows as Apr 11 in places
  // behind UTC. Building the date from its parts keeps it as the local day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (dateOnly) {
    const date = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return dateFormatter.format(date);
  }

  return dateFormatter.format(new Date(dateText));
}

export function formatProjectDates(project) {
  const start = formatDate(project.start_date);

  if (project.end_date) return `${start} to ${formatDate(project.end_date)}`;
  if (project.status === 'planning') return `Planned start: ${start}`;
  if (project.status === 'ongoing') return `Started ${start}`;
  return start;
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, ' ');
}

export function splitLines(text) {
  if (!text) return [];

  const lines = [];
  for (const line of text.split('\n')) {
    const cleanLine = line.trim();
    if (cleanLine) lines.push(cleanLine);
  }
  return lines;
}

export function splitParagraphs(text) {
  if (!text) return [];

  const paragraphs = [];
  for (const paragraph of text.split(/\n\s*\n/)) {
    const cleanParagraph = paragraph.trim();
    if (cleanParagraph) paragraphs.push(cleanParagraph);
  }
  return paragraphs;
}

export const PROJECT_STATUSES = [
  ['planning', 'Planning'],
  ['ongoing', 'Ongoing'],
  ['completed', 'Completed'],
];

export const DISCIPLINES = [
  ['civil', 'Civil'],
  ['structural', 'Structural'],
  ['mechanical', 'Mechanical'],
  ['electrical', 'Electrical'],
  ['other', 'Other'],
];
