// Course info lives in course.json so the website and the downloadable syllabus PDF
// (scripts/build_syllabus_pdf.py) share one source.
import data from './course.json';

export const course = data;
