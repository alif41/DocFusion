import { HtmlTemplate } from './types';

export const HTML_TEMPLATES: HtmlTemplate[] = [
  {
    id: 'invoice',
    title: 'Modern Business Invoice',
    description: 'Crisp commercial invoice with itemized table, VAT calculation, and payment terms.',
    category: 'business',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #INV-2026-089</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      padding: 40px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .brand h1 { font-size: 26px; font-weight: 800; color: #4338ca; letter-spacing: -0.5px; }
    .brand p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .inv-details { text-align: right; }
    .inv-details h2 { font-size: 20px; font-weight: 700; color: #0f172a; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #ecfdf5;
      color: #047857;
      font-size: 12px;
      font-weight: 700;
      border-radius: 9999px;
      margin-top: 6px;
    }
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 20px;
    }
    .col h3 { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
    .col p { font-size: 14px; color: #334155; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
      background: #f8fafc;
      padding: 12px 14px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 14px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .num { text-align: right; }
    .summary {
      width: 280px;
      margin-left: auto;
      margin-bottom: 40px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #475569;
    }
    .summary-row.total {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 6px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>DocFusion Studio Inc.</h1>
      <p>Universal Cloud Platform Services</p>
    </div>
    <div class="inv-details">
      <h2>INVOICE</h2>
      <p style="font-size: 13px; color: #64748b;">#INV-2026-089</p>
      <span class="badge">PAID IN FULL</span>
    </div>
  </div>

  <div class="addresses">
    <div class="col">
      <h3>Billed To:</h3>
      <p><strong>Acme Logistics Global</strong></p>
      <p>450 Enterprise Way, Suite 800</p>
      <p>San Francisco, CA 94107</p>
    </div>
    <div class="col" style="text-align: right;">
      <h3>Invoice Date:</h3>
      <p>September 25, 2026</p>
      <h3 style="margin-top: 8px;">Due Date:</h3>
      <p>October 15, 2026</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Hours / Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Cloud PDF Engine Architecture</strong><br><span style="color:#64748b; font-size:12px;">High-throughput serverless microservices setup</span></td>
        <td class="num">38</td>
        <td class="num">$140.00</td>
        <td class="num">$5,320.00</td>
      </tr>
      <tr>
        <td><strong>Universal Format Transcoding Pipeline</strong><br><span style="color:#64748b; font-size:12px;">Office &amp; Raster vector document conversions</span></td>
        <td class="num">24</td>
        <td class="num">$140.00</td>
        <td class="num">$3,360.00</td>
      </tr>
      <tr>
        <td><strong>Zero-Trust Sandboxing &amp; AES-256 Encryption</strong><br><span style="color:#64748b; font-size:12px;">Client-side ephemeral buffer verification</span></td>
        <td class="num">16</td>
        <td class="num">$150.00</td>
        <td class="num">$2,400.00</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>$11,080.00</span>
    </div>
    <div class="summary-row">
      <span>Tax (8.25%):</span>
      <span>$914.10</span>
    </div>
    <div class="summary-row total">
      <span>Total:</span>
      <span>$11,994.10</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business. For billing questions, contact accounts@docfusion.io</p>
  </div>
</body>
</html>`,
  },
  {
    id: 'report',
    title: 'Executive Quarterly Report',
    description: 'Corporate executive brief with metrics cards, strategic progress, and KPI breakdown.',
    category: 'business',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Q3 2026 Executive Performance Brief</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0f172a;
      padding: 36px;
      line-height: 1.6;
      background: #ffffff;
    }
    .cover-bar {
      height: 6px;
      background: linear-gradient(90deg, #4f46e5, #06b6d4, #10b981);
      margin-bottom: 24px;
      border-radius: 3px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
    }
    h1 { font-size: 24px; font-weight: 800; color: #1e1b4b; }
    .subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
    .meta-box { font-size: 12px; color: #64748b; text-align: right; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .card-val { font-size: 24px; font-weight: 800; color: #1e293b; margin: 4px 0; }
    .card-delta { font-size: 11px; color: #059669; font-weight: 600; }
    h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    p { font-size: 13.5px; color: #334155; margin-bottom: 14px; }
    .callout {
      background: #eef2ff;
      border-left: 4px solid #6366f1;
      padding: 14px 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
      font-size: 13px;
      color: #312e81;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 700; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="cover-bar"></div>
  <div class="header">
    <div>
      <h1>Q3 2026 Executive Performance Brief</h1>
      <p class="subtitle">DocFusion Core Infrastructure &amp; Conversion Ecosystem</p>
    </div>
    <div class="meta-box">
      <strong>Confidential</strong><br>
      Published: Sept 2026
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Monthly Active Conversions</div>
      <div class="card-val">2.84M</div>
      <div class="card-delta">↑ +38.4% vs Q2</div>
    </div>
    <div class="card">
      <div class="card-label">Mean Render Latency</div>
      <div class="card-val">412ms</div>
      <div class="card-delta">↓ -22.1% faster</div>
    </div>
    <div class="card">
      <div class="card-label">Zero-Trust Memory Pass</div>
      <div class="card-val">100.0%</div>
      <div class="card-delta">✓ 0 storage leaks</div>
    </div>
  </div>

  <h2>1. Executive Summary</h2>
  <p>
    During the third quarter of 2026, DocFusion expanded its core document engine to handle universal file transformations, including high-speed office transcoding, raster image processing, and full HTML-to-PDF compilation. Client feedback has indicated significant performance gains across complex tables and CSS-styled invoices.
  </p>

  <div class="callout">
    <strong>Strategic Objective:</strong> Deliver instantaneous HTML rendering with full vector fidelity, preserving font weights, CSS grid layouts, and embedded print rules.
  </div>

  <h2>2. Conversion Performance by Engine</h2>
  <table>
    <thead>
      <tr>
        <th>Conversion Modality</th>
        <th>Input Format</th>
        <th>Target Format</th>
        <th>Avg. Processing Time</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>HTML Compilation</td>
        <td>.HTML / .ZIP</td>
        <td>PDF (Vector)</td>
        <td>320 ms</td>
        <td><strong style="color:#059669;">Optimal</strong></td>
      </tr>
      <tr>
        <td>Universal Doc</td>
        <td>DOCX / PPTX / XLSX</td>
        <td>PDF</td>
        <td>680 ms</td>
        <td><strong style="color:#059669;">Optimal</strong></td>
      </tr>
      <tr>
        <td>Photo Engine</td>
        <td>RAW / HEIC / WEBP</td>
        <td>JPG / PDF</td>
        <td>410 ms</td>
        <td><strong style="color:#059669;">Optimal</strong></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,
  },
  {
    id: 'resume',
    title: 'Professional Developer Resume',
    description: 'Clean two-column technical curriculum vitae with skills badges and career highlights.',
    category: 'creative',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Alex Rivera - Staff Software Engineer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #334155;
      padding: 36px;
      line-height: 1.5;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; }
    .role { font-size: 14px; font-weight: 600; color: #4f46e5; margin-top: 2px; }
    .contact { font-size: 12px; color: #64748b; margin-top: 6px; display: flex; gap: 16px; }
    .layout { display: flex; gap: 28px; }
    .main { flex: 2; }
    .side { flex: 1; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px; }
    .job { margin-bottom: 18px; }
    .job-title { font-size: 14px; font-weight: 700; color: #1e293b; }
    .job-meta { font-size: 12px; color: #64748b; margin-bottom: 6px; }
    ul { padding-left: 16px; font-size: 13px; color: #475569; }
    li { margin-bottom: 4px; }
    .skill-pill {
      display: inline-block;
      padding: 3px 8px;
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      margin: 0 4px 6px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Alex Rivera</h1>
    <div class="role">Staff Software Engineer &amp; Systems Architect</div>
    <div class="contact">
      <span>alex.rivera@example.com</span>
      <span>•</span>
      <span>San Francisco, CA</span>
      <span>•</span>
      <span>github.com/arivera</span>
    </div>
  </div>

  <div class="layout">
    <div class="main">
      <h2>Work Experience</h2>

      <div class="job">
        <div class="job-title">Staff Infrastructure Engineer • CloudScale Technologies</div>
        <div class="job-meta">2023 - Present • San Francisco, CA</div>
        <ul>
          <li>Architected distributed document parsing microservices handling 45M+ monthly files.</li>
          <li>Engineered headless PDF compilation pipeline cutting latency by 48%.</li>
          <li>Led security audit achieving SOC2 Type II compliance with zero data leakage.</li>
        </ul>
      </div>

      <div class="job">
        <div class="job-title">Senior Full-Stack Engineer • Acme Corp</div>
        <div class="job-meta">2020 - 2023 • Seattle, WA</div>
        <ul>
          <li>Designed real-time collaborative document editing workspace with React and WebAssembly.</li>
          <li>Integrated vector rasterization pipelines using Node.js, libvips, and PDF-lib.</li>
        </ul>
      </div>
    </div>

    <div class="side">
      <h2>Technical Skills</h2>
      <div style="margin-bottom: 20px;">
        <span class="skill-pill">TypeScript</span>
        <span class="skill-pill">Node.js</span>
        <span class="skill-pill">React</span>
        <span class="skill-pill">C++</span>
        <span class="skill-pill">WebAssembly</span>
        <span class="skill-pill">PDF-Lib</span>
        <span class="skill-pill">Docker</span>
        <span class="skill-pill">Kubernetes</span>
        <span class="skill-pill">Tailwind CSS</span>
      </div>

      <h2>Education</h2>
      <div style="font-size: 13px;">
        <strong>B.S. in Computer Science</strong><br>
        <span style="color:#64748b;">University of Washington • 2016-2020</span>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'certificate',
    title: 'Certificate of Achievement',
    description: 'Distinguished honor certificate with golden border styling and official signatures.',
    category: 'certificate',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Achievement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', serif;
      color: #1e293b;
      padding: 30px;
      background: #fdfbf7;
      text-align: center;
    }
    .cert-frame {
      border: 4px solid #b45309;
      padding: 36px 40px;
      outline: 2px solid #fef3c7;
      outline-offset: -10px;
      background: #ffffff;
      border-radius: 8px;
    }
    .badge {
      width: 50px;
      height: 50px;
      margin: 0 auto 12px;
      background: linear-gradient(135deg, #d97706, #b45309);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
      font-size: 22px;
      box-shadow: 0 4px 10px rgba(180, 83, 9, 0.25);
    }
    h1 {
      font-size: 30px;
      font-weight: 700;
      color: #78350f;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 24px;
    }
    .recipient {
      font-size: 28px;
      font-weight: bold;
      color: #0f172a;
      border-bottom: 2px solid #b45309;
      display: inline-block;
      padding: 0 36px 6px;
      margin-bottom: 18px;
    }
    .desc {
      font-size: 14px;
      color: #44403c;
      max-width: 500px;
      margin: 0 auto 36px;
      line-height: 1.6;
    }
    .sig-row {
      display: flex;
      justify-content: space-around;
      margin-top: 30px;
    }
    .sig-box {
      width: 180px;
      border-top: 1px solid #78716c;
      padding-top: 6px;
      font-size: 12px;
      color: #57534e;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="badge">★</div>
    <h1>Certificate of Excellence</h1>
    <div class="subtitle">Presented In Recognition Of Outstanding Merit</div>

    <div class="recipient">Sarah Montgomery</div>

    <p class="desc">
      For exceptional dedication, mastery of modern cloud architectures, and exemplary leadership in delivering secure universal document transformation pipelines at DocFusion.
    </p>

    <div class="sig-row">
      <div class="sig-box">
        <strong>Dr. Elizabeth Vance</strong><br>
        Chief Technology Officer
      </div>
      <div class="sig-box">
        <strong>Marcus Sterling</strong><br>
        Director of Engineering
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'documentation',
    title: 'Clean Technical Documentation',
    description: 'Technical document with code blocks, callouts, and clean layout.',
    category: 'technical',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation - HTML to PDF Microservice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      padding: 36px;
      line-height: 1.6;
      background: #ffffff;
    }
    h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .tagline { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    p { font-size: 13.5px; color: #334155; margin-bottom: 12px; }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 16px;
      border-radius: 8px;
      font-family: 'SFMono-Regular', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.4;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
    .notice {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 12px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      color: #1e40af;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <h1>HTML to PDF Microservice API</h1>
  <p class="tagline">DocFusion Developer Platform Reference Guide • Version 2.4</p>

  <h2>Endpoint Overview</h2>
  <p>The <code>POST /api/html-to-pdf/convert</code> endpoint converts standard HTML/CSS code or pre-packaged ZIP bundles into production-ready PDF documents.</p>

  <div class="notice">
    <strong>Security Guarantee:</strong> All document conversions execute inside ephemeral memory buffers. User assets and documents are never permanently stored on disk.
  </div>

  <h2>Example Request Payload</h2>
  <pre>curl -X POST https://docfusion.io/api/html-to-pdf/convert \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "&lt;h1&gt;Hello World&lt;/h1&gt;",
    "config": {
      "pageSize": "A4",
      "orientation": "portrait",
      "printBackground": true
    }
  }'</pre>

  <h2>Configurable PDF Parameters</h2>
  <p>Parameters include page size (A4, A3, Letter, Legal), custom margins in millimeters or inches, custom header/footer rules with page numbering, and background color rendering.</p>
</body>
</html>`,
  },
];
