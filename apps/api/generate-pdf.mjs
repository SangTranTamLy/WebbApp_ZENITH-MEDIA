import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

async function generatePDF() {
  const rootDir = path.resolve(process.cwd(), '../..');
  const mdPath = path.join(rootDir, 'docs', 'mda-assistant-whitepaper.md');
  const pdfPath = path.join(rootDir, 'apps', 'web', 'public', 'mda-assistant.pdf');

  console.log('Reading Markdown file...');
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  console.log('Converting to HTML...');
  const htmlContent = marked.parse(mdContent);

  const fullHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>MDA Assistant Architecture</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      h1, h2, h3 { color: #111; }
      h1 { font-size: 2.2em; border-bottom: 2px solid #eaecef; padding-bottom: 0.3em; margin-bottom: 30px; }
      h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 40px; }
      h3 { font-size: 1.25em; margin-top: 30px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 10px; }
      strong { font-weight: 600; }
    </style>
  </head>
  <body>
    ${htmlContent}
  </body>
  </html>
  `;

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  
  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });

  await browser.close();
  console.log(`PDF generated successfully at: ${pdfPath}`);
}

generatePDF().catch(console.error);
