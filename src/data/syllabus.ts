// Grading and policies live in syllabus.json so the website and the downloadable
// PDF (scripts/build_syllabus_pdf.py → public/isom-260-syllabus.pdf) share one source.
import data from './syllabus.json';

export const grading = data.grading;
export const policies = data.policies;
