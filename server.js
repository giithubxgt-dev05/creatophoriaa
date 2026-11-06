/**
 * ══════════════════════════════════════════════════════════════════════
 * CREATOPHORIA STUDIO — BACKEND SERVER & LEADS API
 * ══════════════════════════════════════════════════════════════════════
 * Ultra-fast, zero-dependency Node.js HTTP server.
 * Handles client inquiries, contact data collection, lead management,
 * CSV export, and static file serving with CORS support.
 * ══════════════════════════════════════════════════════════════════════
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env or .env.local if present
['.env.local', '.env'].forEach(envName => {
  const envPath = path.join(__dirname, envName);
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.substring(0, idx).trim();
          const v = trimmed.substring(idx + 1).trim();
          if (k && !process.env[k]) {
            process.env[k] = v;
          }
        }
      });
    } catch (e) {}
  }
});

const PORT = process.env.PORT || 3000;
let DATA_DIR = path.join(__dirname, 'data');
let LEADS_FILE = path.join(DATA_DIR, 'leads.json');
let CSV_FILE = path.join(DATA_DIR, 'leads.csv');

// Ensure data directory and files exist with fallback
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[Storage Notice] Using root directory for data files:', err.message);
  DATA_DIR = __dirname;
  LEADS_FILE = path.join(__dirname, 'leads.json');
  CSV_FILE = path.join(__dirname, 'leads.csv');
}

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
}

if (!fs.existsSync(CSV_FILE)) {
  const csvHeaders = 'ID,Date,Name,Contact,Email,Service,Budget,Timeline,Message,Status,Notes\n';
  fs.writeFileSync(CSV_FILE, csvHeaders, 'utf8');
}

// Helper: Read all leads from JSON
function readLeads() {
  try {
    const raw = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB Read Error]:', err.message);
    return [];
  }
}

// Helper: Save leads atomically to avoid data corruption
function saveLeads(leads) {
  try {
    const tempFile = LEADS_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(leads, null, 2), 'utf8');
    fs.renameSync(tempFile, LEADS_FILE);
    updateCSV(leads);
    return true;
  } catch (err) {
    console.error('[DB Write Error]:', err.message);
    return false;
  }
}

// Helper: Escape CSV string
function escapeCSV(str) {
  if (str === null || str === undefined) return '""';
  const clean = String(str).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${clean}"`;
}

// Helper: Update full CSV backup
function updateCSV(leads) {
  try {
    let csv = 'ID,Date,Name,Contact,Email,Service,Budget,Timeline,Message,Status,Notes\n';
    leads.forEach(l => {
      csv += [
        escapeCSV(l.id),
        escapeCSV(l.createdAt || ''),
        escapeCSV(l.name || ''),
        escapeCSV(l.contact || ''),
        escapeCSV(l.email || ''),
        escapeCSV(l.service || ''),
        escapeCSV(l.budget || ''),
        escapeCSV(l.timeline || ''),
        escapeCSV(l.message || ''),
        escapeCSV(l.status || 'new'),
        escapeCSV(l.notes || '')
      ].join(',') + '\n';
    });
    fs.writeFileSync(CSV_FILE, csv, 'utf8');
  } catch (err) {
    console.error('[CSV Update Error]:', err.message);
  }
}

// Helper: Parse JSON or Form Body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';
      if (!body.trim()) {
        resolve({});
        return;
      }
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON format'));
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const parsed = {};
        const params = new URLSearchParams(body);
        for (const [key, value] of params.entries()) {
          parsed[key] = value;
        }
        resolve(parsed);
      } else {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      }
    });
    req.on('error', err => reject(err));
  });
}

// MIME types lookup table
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.csv': 'text/csv; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8'
};

// Secret Admin Passcode (read strictly from secure environment variables)
const ADMIN_KEY = process.env.ADMIN_KEY;

function isAuthorized(req, query) {
  if (!ADMIN_KEY) return false;
  const headerKey = req.headers['x-admin-key'] ||
                    (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const queryKey = query && query.key;
  return (headerKey === ADMIN_KEY) || (queryKey === ADMIN_KEY);
}

// Response sender helper
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
  });
  res.end(JSON.stringify(data));
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ════════════════════════════════════════════════════════════════════
  // API ROUTING
  // ════════════════════════════════════════════════════════════════════

  // 1. POST /api/leads or /api/contact — Collect specific client inquiry
  if ((pathname === '/api/leads' || pathname === '/api/contact') && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      const name = (data.name || '').trim();
      const contact = (data.contact || data.phone || '').trim();
      const email = (data.email || '').trim();
      const service = (data.service || '').trim();
      const message = (data.message || data.projectBrief || '').trim();
      const budget = (data.budget || 'Flexible').trim();
      const timeline = (data.timeline || 'Flexible').trim();

      // Validation
      if (!name) {
        return sendJSON(res, 400, { success: false, error: 'Name is required' });
      }
      if (!contact && !email) {
        return sendJSON(res, 400, { success: false, error: 'At least one contact method (phone/WhatsApp or email) is required' });
      }
      if (!service) {
        return sendJSON(res, 400, { success: false, error: 'Service required must be selected' });
      }

      const leads = readLeads();
      const now = new Date();
      const leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const newLead = {
        id: leadId,
        name,
        contact,
        email,
        service,
        budget,
        timeline,
        message,
        status: 'new', // new, contacted, in_discussion, booked, archived
        notes: '',
        createdAt: now.toISOString(),
        formattedDate: now.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userAgent: req.headers['user-agent'] || '',
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
      };

      leads.unshift(newLead);
      saveLeads(leads);

      // Supabase Postgres Synchronization
      const supabaseUrl = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          fetch(`${supabaseUrl}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify([{
              name: newLead.name,
              contact: newLead.contact,
              email: newLead.email,
              service: newLead.service,
              budget: newLead.budget,
              timeline: newLead.timeline,
              message: newLead.message,
              status: newLead.status,
              notes: newLead.notes,
              ip_address: newLead.ip
            }])
          }).catch(err => console.warn('[Supabase Sync Notice]:', err.message));
        } catch (dbErr) {
          console.warn('[Supabase Sync Notice]:', dbErr.message);
        }
      }

      console.log(`[NEW LEAD] ${name} | Service: ${service} | Contact: ${contact || email}`);

      return sendJSON(res, 201, {
        success: true,
        message: "Thank you! We've received your project inquiry. Creatophoria Studio will connect with you within 24 hours.",
        lead: {
          id: newLead.id,
          name: newLead.name,
          service: newLead.service,
          contact: newLead.contact,
          email: newLead.email,
          createdAt: newLead.formattedDate
        }
      });
    } catch (err) {
      console.error('[Lead Submission Error]:', err);
      return sendJSON(res, 500, { success: false, error: 'Internal server error processing lead' });
    }
  }

  // 2. GET /api/leads — Fetch all leads (Protected)
  if (pathname === '/api/leads' && req.method === 'GET') {
    if (!isAuthorized(req, parsedUrl.query)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Access Denied' });
    }

    let leads = readLeads();
    const supabaseUrl = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const sbRes = await fetch(`${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (sbRes.ok) {
          const sbLeads = await sbRes.json();
          if (Array.isArray(sbLeads) && sbLeads.length > 0) {
            leads = sbLeads.map(l => ({
              id: l.id,
              name: l.name,
              contact: l.contact,
              email: l.email,
              service: l.service,
              budget: l.budget,
              timeline: l.timeline,
              message: l.message,
              status: l.status,
              notes: l.notes || '',
              createdAt: l.created_at,
              formattedDate: new Date(l.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }));
          }
        }
      } catch (e) {
        console.warn('[Supabase Fetch Notice]:', e.message);
      }
    }

    const query = parsedUrl.query;

    if (query.status && query.status !== 'all') {
      leads = leads.filter(l => (l.status || '').toLowerCase() === query.status.toLowerCase());
    }

    if (query.service && query.service !== 'all') {
      leads = leads.filter(l => (l.service || '').toLowerCase() === query.service.toLowerCase());
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      leads = leads.filter(l =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.contact && l.contact.toLowerCase().includes(q)) ||
        (l.service && l.service.toLowerCase().includes(q)) ||
        (l.message && l.message.toLowerCase().includes(q))
      );
    }

    return sendJSON(res, 200, {
      success: true,
      count: leads.length,
      leads
    });
  }

  // 3. GET /api/stats — Leads overview analytics (Protected)
  if (pathname === '/api/stats' && req.method === 'GET') {
    if (!isAuthorized(req, parsedUrl.query)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Access Denied' });
    }

    let leads = readLeads();
    const supabaseUrl = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const sbRes = await fetch(`${supabaseUrl}/rest/v1/leads?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        if (sbRes.ok) {
          const sbLeads = await sbRes.json();
          if (Array.isArray(sbLeads)) leads = sbLeads;
        }
      } catch (e) {}
    }

    const stats = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      inDiscussion: leads.filter(l => l.status === 'in_discussion').length,
      booked: leads.filter(l => l.status === 'booked').length,
      services: {}
    };

    leads.forEach(l => {
      const s = l.service || 'Other';
      stats.services[s] = (stats.services[s] || 0) + 1;
    });

    return sendJSON(res, 200, { success: true, stats });
  }

  // 4. PATCH /api/leads/:id — Update lead status or notes (Protected)
  if (pathname.startsWith('/api/leads/') && req.method === 'PATCH') {
    if (!isAuthorized(req, parsedUrl.query)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Access Denied' });
    }

    const id = pathname.replace('/api/leads/', '');
    try {
      const data = await parseBody(req);
      const leads = readLeads();
      const index = leads.findIndex(l => l.id === id);

      if (index !== -1) {
        if (data.status) leads[index].status = data.status;
        if (typeof data.notes === 'string') leads[index].notes = data.notes;
        leads[index].updatedAt = new Date().toISOString();
        saveLeads(leads);
      }

      // Update Supabase
      const supabaseUrl = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(data)
          }).catch(() => {});
        } catch (e) {}
      }

      return sendJSON(res, 200, { success: true, lead: index !== -1 ? leads[index] : { id, ...data } });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: 'Error updating lead' });
    }
  }

  // 5. DELETE /api/leads/:id — Delete lead (Protected)
  if (pathname.startsWith('/api/leads/') && req.method === 'DELETE') {
    if (!isAuthorized(req, parsedUrl.query)) {
      return sendJSON(res, 401, { success: false, error: 'Unauthorized: Access Denied' });
    }

    const id = pathname.replace('/api/leads/', '');
    const leads = readLeads();
    const filtered = leads.filter(l => l.id !== id);
    saveLeads(filtered);

    // Delete from Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        fetch(`${supabaseUrl}/rest/v1/leads?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }).catch(() => {});
      } catch (e) {}
    }

    return sendJSON(res, 200, { success: true, message: 'Lead deleted successfully' });
  }

  // 6. GET /api/leads/export — Export CSV (Protected)
  if (pathname === '/api/leads/export' && req.method === 'GET') {
    if (!isAuthorized(req, parsedUrl.query)) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('401 Unauthorized: Invalid or missing admin key');
      return;
    }

    if (fs.existsSync(CSV_FILE)) {
      const csvData = fs.readFileSync(CSV_FILE, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': 'attachment; filename="creatophoria_leads.csv"',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(csvData);
      return;
    } else {
      return sendJSON(res, 404, { success: false, error: 'No CSV data found' });
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // STATIC FILE SERVING
  // ════════════════════════════════════════════════════════════════════
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(__dirname, safePath);

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If requesting a route without extension, try appending .html
      if (!path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          serveStaticFile(htmlPath, res);
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    serveStaticFile(filePath, res);
  });
});

function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error reading file');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`  ✦ CREATOPHORIA STUDIO — LEADS ENGINE & BACKEND ACTIVE ✦`);
  console.log(`══════════════════════════════════════════════════════════════`);
  console.log(`  ➤ Website:       http://localhost:${PORT}/`);
  console.log(`  ➤ Admin Portal:  http://localhost:${PORT}/admin.html`);
  console.log(`  ➤ Leads API:     http://localhost:${PORT}/api/leads`);
  console.log(`  ➤ Leads CSV:     http://localhost:${PORT}/api/leads/export`);
  console.log(`  ➤ Storage:       ${DATA_DIR}`);
  console.log(`══════════════════════════════════════════════════════════════\n`);
});

module.exports = {
  server,
  readLeads,
  saveLeads,
  DATA_DIR,
  LEADS_FILE,
  CSV_FILE
};
