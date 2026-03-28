/**
 * externalData.js — Dekleptocracy Explorer External Data Integration
 *
 * This is a REFERENCE MODULE, not loaded by the app. The actual integration
 * code lives inline in index.html under the "EXTERNAL DATA INTEGRATION" section.
 *
 * COMPANION FILES:
 *   - apiConfig.js — Master API configuration with endpoints, rate limits,
 *     query construction patterns, example responses, and fetch functions.
 *     Start there when enabling a new data source.
 *   - index.html — Contains the live extDataConfig object, formatters,
 *     and renderExtDataSlots() that this file documents.
 *
 * This file documents:
 *   1. The configuration schema for each external data source
 *   2. Example API responses showing what the data looks like
 *   3. Ready-to-use fetch functions for when APIs are connected
 *   4. The data formatter contract each source must implement
 *
 * To enable a data source:
 *   1. Copy the fetch function into the corresponding extDataConfig entry
 *   2. Set enabled: true
 *   3. If an API key is required, add it to the params object
 *   4. The slot will automatically appear for the correct node types
 */

// ============================================================
// CONFIGURATION SCHEMA
// ============================================================
//
// Each entry in extDataConfig follows this shape:
//
// {
//   enabled: boolean,          // Whether this source is active
//   label: string,             // Display name in the sidebar header
//   nodeTypes: string[],       // Which node types show this slot
//   endpoint: string|null,     // Base API URL
//   params: object,            // Default query parameters
//   fetch: async function,     // (nodeName) => apiResponse
//   format: function           // (nodeName, apiResponse) => HTML string
// }


// ============================================================
// 1. POLITICAL DONATIONS (FEC API)
// ============================================================
//
// Shows for: person nodes
// API docs: https://api.open.fec.gov/developers/
// Rate limit: DEMO_KEY = 30 requests/hour/IP
//            Registered key = 1000 requests/hour (free at https://api.data.gov/signup/)
//
// The existing loadFEC() function in Layer 3 already makes live FEC calls.
// This slot is designed for a richer, dedicated display with more fields.

// Example API response from /v1/schedules/schedule_a/:
const EXAMPLE_DONATIONS_RESPONSE = {
  api_version: "1.0",
  pagination: { count: 47, page: 1, pages: 5, per_page: 10 },
  results: [
    {
      contributor_name: "THIEL, PETER",
      committee_name: "JD VANCE FOR SENATE",
      contribution_receipt_amount: 2800,
      contribution_receipt_date: "2024-03-15",
      contributor_employer: "FOUNDERS FUND",
      contributor_occupation: "INVESTOR",
      contributor_city: "SAN FRANCISCO",
      contributor_state: "CA",
      receipt_type_full: "Individual contribution"
    },
    {
      contributor_name: "THIEL, PETER",
      committee_name: "PROTECT THE MISSION PAC",
      contribution_receipt_amount: 15000000,
      contribution_receipt_date: "2022-06-01",
      contributor_employer: "FOUNDERS FUND",
      contributor_occupation: "INVESTOR",
      contributor_city: "SAN FRANCISCO",
      contributor_state: "CA",
      receipt_type_full: "PAC contribution"
    }
  ]
};

// Ready-to-use fetch function:
async function fetchDonations(nodeName) {
  const searchName = nodeName.replace(/\s*\/.*$/, '').replace(/\s*\(.*?\)/g, '').trim();
  const params = new URLSearchParams({
    contributor_name: searchName,
    sort: '-contribution_receipt_amount',
    per_page: '10',
    api_key: 'DEMO_KEY' // Replace with registered key for production
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const resp = await fetch(
      `https://api.fec.gov/v1/schedules/schedule_a/?${params}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}


// ============================================================
// 2. CORPORATE FILINGS (SEC EDGAR)
// ============================================================
//
// Shows for: organization nodes
// API docs: https://efts.sec.gov/LATEST/search-index (free, no key needed)
// Rate limit: 10 requests/second (respect User-Agent header requirement)
//
// SEC EDGAR full-text search returns filings that mention the entity name.

// Example API response from EDGAR full-text search:
const EXAMPLE_FILINGS_RESPONSE = {
  hits: {
    total: { value: 23 },
    hits: [
      {
        _source: {
          entity_name: "AFFINITY PARTNERS FUND LP",
          file_date: "2024-01-15",
          form_type: "D",
          file_num: "028-12345",
          period_of_report: "2024-01-15",
          file_description: "Notice of exempt offering of securities"
        }
      },
      {
        _source: {
          entity_name: "TRUMP MEDIA & TECHNOLOGY GROUP CORP",
          file_date: "2024-03-22",
          form_type: "10-K",
          file_num: "001-41178",
          period_of_report: "2023-12-31",
          file_description: "Annual report"
        }
      },
      {
        _source: {
          entity_name: "BINANCE HOLDINGS LIMITED",
          file_date: "2023-11-21",
          form_type: "8-K",
          file_num: "000-00000",
          period_of_report: "2023-11-21",
          file_description: "Current report"
        }
      }
    ]
  }
};

// Ready-to-use fetch function:
async function fetchFilings(nodeName) {
  const params = new URLSearchParams({
    q: '"' + nodeName + '"',
    dateRange: 'custom',
    startdt: '2020-01-01'
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const resp = await fetch(
      `https://efts.sec.gov/LATEST/search-index?${params}`,
      {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'DekleptocracyExplorer/1.0 (research)' }
      }
    );
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}


// ============================================================
// 3. NEWS MENTIONS (placeholder)
// ============================================================
//
// Shows for: all node types
// Candidate APIs:
//   - GDELT API (free, global news): https://api.gdeltproject.org/api/v2/doc/doc
//   - NewsAPI.org (free tier 100 req/day): https://newsapi.org/v2/everything
//   - MediaCloud (academic/research): https://mediacloud.org/
//
// Currently the app uses the internal articles array as a fallback.
// This slot is for real-time news monitoring once an API is chosen.

// Example API response (NewsAPI format):
const EXAMPLE_NEWS_RESPONSE = {
  status: "ok",
  totalResults: 12,
  articles: [
    {
      title: "Treasury Department Weakens Sanctions Enforcement Under New Leadership",
      source: { name: "Reuters" },
      publishedAt: "2025-03-10T14:30:00Z",
      url: "https://reuters.com/example-article",
      description: "OFAC staffing reduced by 30% since January..."
    },
    {
      title: "Kushner Fund Reports $2B in Gulf Sovereign Capital",
      source: { name: "Financial Times" },
      publishedAt: "2025-02-28T09:00:00Z",
      url: "https://ft.com/example-article",
      description: "Affinity Partners disclosed..."
    }
  ]
};

// Ready-to-use fetch function (NewsAPI example):
async function fetchNews(nodeName) {
  const API_KEY = 'YOUR_NEWSAPI_KEY'; // Get from https://newsapi.org/register
  const params = new URLSearchParams({
    q: nodeName,
    sortBy: 'publishedAt',
    pageSize: '5',
    apiKey: API_KEY
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const resp = await fetch(
      `https://newsapi.org/v2/everything?${params}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}


// ============================================================
// HOW TO ACTIVATE A DATA SOURCE
// ============================================================
//
// Step 1: In index.html, find the extDataConfig object
//
// Step 2: Set enabled: true for the source you want to activate
//
// Step 3: Add the fetch function. Example for donations:
//
//   donations: {
//     enabled: true,
//     label: 'Political Donations',
//     nodeTypes: ['person'],
//     endpoint: 'https://api.fec.gov/v1/schedules/schedule_a/',
//     params: { api_key: 'YOUR_KEY', sort: '-contribution_receipt_amount', per_page: 10 },
//     fetch: fetchDonations,   // <-- add this
//     format: formatDonations
//   }
//
// Step 4: In the renderExtDataSlots() function, replace the setTimeout stub with:
//
//   if (cfg.fetch) {
//     cfg.fetch(nd.name)
//       .then(function(data) {
//         bodyEl.innerHTML = cfg.format(nd.name, data);
//       })
//       .catch(function(err) {
//         bodyEl.innerHTML = '<div class="sb-ext-error">Data unavailable. ' + err.message + '</div>';
//       });
//   } else {
//     bodyEl.innerHTML = cfg.format(nd.name, null);
//   }
//
// Step 5: Deploy and test. The slot will appear only for the configured node types.
//         Disabled sources remain completely hidden — no loading, no errors.
