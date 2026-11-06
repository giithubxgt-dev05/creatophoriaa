/**
 * ══════════════════════════════════════════════════════════════════════
 * CREATOPHORIA STUDIO — VERCEL SERVERLESS LEADS & ADMIN API
 * ══════════════════════════════════════════════════════════════════════
 * Compatible with Vercel Serverless Functions.
 * Handles:
 *  - Client inquiry submission (POST)
 *  - Admin lead listing (GET /api/leads)
 *  - Leads stats & analytics (GET /api/stats)
 *  - CSV export (GET /api/leads/export)
 *  - Lead status & notes update (PATCH /api/leads/:id)
 *  - Lead deletion (DELETE /api/leads/:id)
 * Directly synchronized with Supabase Postgres (public.leads).
 * ══════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Crucial credentials are read strictly from secure environment variables
const ADMIN_KEY = process.env.ADMIN_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://izckruhjcmrxyfpuzxyo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const TMP_FILE = '/tmp/leads.json';
let inMemoryLeads = [];

function loadLocalLeads() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
    }
  } catch (e) {}
  return inMemoryLeads;
}

function persistLocalLeads(leads) {
  inMemoryLeads = leads;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {}
}

function checkAuth(req) {
  if (!ADMIN_KEY) return false;
  const headerKey = req.headers['x-admin-key'] ||
                    (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const queryKey = req.query && req.query.key;
  return (headerKey === ADMIN_KEY) || (queryKey === ADMIN_KEY);
}

// Fetch leads from Supabase Postgres
async function fetchSupabaseLeads() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map(l => ({
      id: l.id,
      name: l.name || '',
      contact: l.contact || '',
      email: l.email || '',
      service: l.service || '',
      budget: l.budget || 'Flexible',
      timeline: l.timeline || 'Flexible',
      message: l.message || '',
      status: l.status || 'new',
      notes: l.notes || '',
      createdAt: l.created_at,
      formattedDate: l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Recent',
      ip: l.ip_address || ''
    }));
  } catch (err) {
    console.warn('[Supabase Fetch Error]:', err.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const method = req.method || 'GET';
    const query = req.query || {};
    const leadId = query.id;

  // ══════════════════════════════════════════════════════════════════════
  // 1. POST — Public Client Inquiry Submission
  // ══════════════════════════════════════════════════════════════════════
  if (method === 'POST') {
    try {
      const data = req.body || {};
      const name = (data.name || '').trim();
      const contact = (data.contact || data.phone || '').trim();
      const email = (data.email || '').trim();
      const service = (data.service || '').trim();
      const message = (data.message || data.projectBrief || '').trim();
      const budget = (data.budget || 'Flexible').trim();
      const timeline = (data.timeline || 'Flexible').trim();

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      if (!contact && !email) {
        return res.status(400).json({ success: false, error: 'Contact phone/WhatsApp or email is required' });
      }
      if (!service) {
        return res.status(400).json({ success: false, error: 'Service required must be selected' });
      }

      const now = new Date();
      const newLead = {
        name,
        contact,
        email,
        service,
        budget,
        timeline,
        message,
        status: 'new',
        notes: '',
        ip_address: (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || ''
      };

      let createdLeadId = 'lead_' + Date.now();

      // Insert into Supabase
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify([newLead])
          });
          if (sbRes.ok) {
            const inserted = await sbRes.json();
            if (inserted && inserted[0] && inserted[0].id) {
              createdLeadId = inserted[0].id;
            }
          }
        } catch (dbErr) {
          console.warn('[Supabase Insert Notice]:', dbErr.message);
        }
      }

      // Memory/tmp cache
      const localLeads = loadLocalLeads();
      localLeads.unshift({
        id: createdLeadId,
        ...newLead,
        createdAt: now.toISOString(),
        formattedDate: now.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      persistLocalLeads(localLeads);

      return res.status(201).json({
        success: true,
        message: "Thank you! We've received your project inquiry. Creatophoria Studio will connect with you within 24 hours.",
        lead: {
          id: createdLeadId,
          name,
          service,
          contact,
          email,
          createdAt: now.toISOString()
        }
      });
    } catch (err) {
      console.error('[Lead POST Error]:', err);
      return res.status(500).json({ success: false, error: 'Internal server error processing lead' });
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2. GET — Leads, Stats, or CSV Export (Protected)
  // ══════════════════════════════════════════════════════════════════════
  if (method === 'GET') {
    if (!checkAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Access Denied' });
    }

    // Attempt Supabase fetch first, fallback to local memory
    let leads = await fetchSupabaseLeads();
    if (!leads) {
      leads = loadLocalLeads();
    }

    // 2a. Stats endpoint
    if (query.action === 'stats') {
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
      return res.status(200).json({ success: true, stats });
    }

    // 2b. CSV export
    if (query.export === 'csv') {
      let csv = 'ID,Date,Name,Contact,Email,Service,Budget,Timeline,Message,Status,Notes\n';
      leads.forEach(l => {
        const clean = str => `"${String(str || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
        csv += `${clean(l.id)},${clean(l.createdAt || '')},${clean(l.name)},${clean(l.contact)},${clean(l.email)},${clean(l.service)},${clean(l.budget)},${clean(l.timeline)},${clean(l.message)},${clean(l.status)},${clean(l.notes)}\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
      res.setHeader('Content-Disposition', 'attachment; filename="creatophoria_leads.csv"');
      return res.status(200).send(csv);
    }

    // 2c. Filters
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

    return res.status(200).json({
      success: true,
      count: leads.length,
      leads
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3. PATCH — Update Lead Status or Notes (Protected)
  // ══════════════════════════════════════════════════════════════════════
  if (method === 'PATCH') {
    if (!checkAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Access Denied' });
    }

    const id = leadId;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Lead ID is required' });
    }

    const body = req.body || {};
    const updateData = {};
    if (body.status) updateData.status = body.status;
    if (typeof body.notes === 'string') updateData.notes = body.notes;
    updateData.updated_at = new Date().toISOString();

    // Update in Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify(updateData)
        });
      } catch (e) {
        console.warn('[Supabase PATCH Error]:', e.message);
      }
    }

    // Update local cache
    const localLeads = loadLocalLeads();
    const idx = localLeads.findIndex(l => String(l.id) === String(id));
    if (idx !== -1) {
      if (body.status) localLeads[idx].status = body.status;
      if (typeof body.notes === 'string') localLeads[idx].notes = body.notes;
      persistLocalLeads(localLeads);
    }

    return res.status(200).json({ success: true, message: 'Lead updated successfully' });
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. DELETE — Delete Lead (Protected)
  // ══════════════════════════════════════════════════════════════════════
  if (method === 'DELETE') {
    if (!checkAuth(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Access Denied' });
    }

    const id = leadId;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Lead ID is required' });
    }

    // Delete in Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
      } catch (e) {
        console.warn('[Supabase DELETE Error]:', e.message);
      }
    }

    // Delete in local cache
    const localLeads = loadLocalLeads();
    const filtered = localLeads.filter(l => String(l.id) !== String(id));
    persistLocalLeads(filtered);

    return res.status(200).json({ success: true, message: 'Lead deleted' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (fatalErr) {
    console.error('[API Fatal Error]:', fatalErr);
    return res.status(500).json({ success: false, error: fatalErr.message });
  }
};
