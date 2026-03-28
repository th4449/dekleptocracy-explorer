/**
 * apiConfig.js — Dekleptocracy Explorer API Configuration
 * ========================================================
 *
 * Central configuration for all external data source integrations.
 * This file defines endpoints, query construction, rate limits,
 * response formatters, and example responses for each data source.
 *
 * IMPORTANT: This file is a configuration reference that mirrors the
 * extDataConfig object in index.html. To activate a data source:
 *
 *   1. Open index.html
 *   2. Find the extDataConfig object (search for "EXTERNAL DATA INTEGRATION")
 *   3. Set enabled: true for the source you want
 *   4. Add the fetch function from this file
 *   5. Deploy and test
 *
 * The inline extDataConfig in index.html is the live config.
 * This file serves as the authoritative reference and documentation.
 *
 * Version: 1.0
 * Last updated: 2026-03-28
 * Repository: https://github.com/th4449/dekleptocracy-explorer
 */


// ============================================================
// MASTER CONFIGURATION OBJECT
// ============================================================

const apiConfig = {

  // ──────────────────────────────────────────────────────────
  // 1. POLITICAL DONATIONS
  // ──────────────────────────────────────────────────────────
  //
  // Data source: Federal Election Commission (FEC) API
  // Documentation: https://api.open.fec.gov/developers/
  // Authentication: API key (free at https://api.data.gov/signup/)
  // Cost: Free
  //
  // What it provides:
  //   - Individual contributions made by a person to political committees
  //   - Committee-level fundraising and spending totals
  //   - Employer, occupation, and location of contributors
  //
  // Why it matters for Dekleptocracy:
  //   - Maps political donation networks connecting persons to campaigns
  //   - Reveals bundling patterns and dark money conduits
  //   - Cross-references with lobbying and foreign agent registrations
  //
  // How to enable:
  //   1. Get a free API key at https://api.data.gov/signup/
  //   2. In extDataConfig.donations, set enabled: true
  //   3. Replace params.api_key with your key
  //   4. Uncomment the fetch function or paste fetchDonations() from below

  politicalDonations: {
    enabled: false,
    endpoint: "https://api.fec.gov/v1/schedules/schedule_a/",
    queryParams: {
      // {nodeName} is replaced at runtime with the selected node's name
      contributor_name: "{nodeName}",
      sort: "-contribution_receipt_amount",
      per_page: 10,
      api_key: "DEMO_KEY"   // DEMO_KEY = 30 req/hr. Replace with registered key.
    },
    responseFormatter: "formatFECDonations",
    rateLimit: 30,  // requests per minute (DEMO_KEY limit is 30/hour)
    nodeTypes: ["person"],
    fallbackEndpoint: "https://api.fec.gov/v1/committees/",
    fallbackQueryParams: {
      q: "{nodeName}",
      sort: "-receipts",
      per_page: 3,
      api_key: "DEMO_KEY"
    },
    notes: "Falls back to committee search for PACs and organizations. Strip suffixes like '/ CZ' or '(Crypto Czar)' from names before querying."
  },


  // ──────────────────────────────────────────────────────────
  // 2. CORPORATE FILINGS
  // ──────────────────────────────────────────────────────────
  //
  // Data source: SEC EDGAR Full-Text Search
  // Documentation: https://efts.sec.gov/LATEST/search-index (undocumented but stable)
  // Authentication: None required
  // Cost: Free
  //
  // What it provides:
  //   - SEC filings (10-K, 10-Q, 8-K, Form D, proxy statements)
  //   - Full-text search across all EDGAR filings
  //   - Entity names, filing dates, form types, file numbers
  //
  // Why it matters for Dekleptocracy:
  //   - Reveals corporate structures, subsidiaries, and beneficial owners
  //   - Catches Form D exempt offerings (private fundraising)
  //   - 8-K filings disclose material events (settlements, investigations)
  //
  // How to enable:
  //   1. No API key needed
  //   2. In extDataConfig.filings, set enabled: true
  //   3. Uncomment the fetch function or paste fetchFilings() from below
  //   4. Set User-Agent header to identify your application

  corporateFilings: {
    enabled: false,
    endpoint: "https://efts.sec.gov/LATEST/search-index",
    queryParams: {
      q: '"{nodeName}"',           // Exact phrase match in quotes
      dateRange: "custom",
      startdt: "2020-01-01"        // Limit to recent filings
    },
    responseFormatter: "formatSECFilings",
    rateLimit: 600,  // SEC allows 10 requests/second = 600/minute
    nodeTypes: ["organization"],
    requiredHeaders: {
      "User-Agent": "DekleptocracyExplorer/1.0 (research; dekleptocracy.substack.com)"
    },
    notes: "SEC requires a descriptive User-Agent header. Omitting it may result in throttling. No API key needed."
  },


  // ──────────────────────────────────────────────────────────
  // 3. NEWS MENTIONS
  // ──────────────────────────────────────────────────────────
  //
  // Data source: TBD — candidates ranked by suitability
  //
  //   Option A: GDELT Project API (recommended)
  //     URL: https://api.gdeltproject.org/api/v2/doc/doc
  //     Auth: None
  //     Cost: Free
  //     Pros: Global coverage, no API key, real-time
  //     Cons: Complex query syntax, no pagination
  //
  //   Option B: NewsAPI.org
  //     URL: https://newsapi.org/v2/everything
  //     Auth: API key (free tier = 100 requests/day)
  //     Cost: Free tier available, paid plans from $449/mo
  //     Pros: Clean JSON, good documentation
  //     Cons: Free tier is developer-only (not for production)
  //
  //   Option C: MediaCloud
  //     URL: https://mediacloud.org/
  //     Auth: API key (academic/research)
  //     Cost: Free for research
  //     Pros: Academic rigor, historical depth
  //     Cons: Requires application, slower
  //
  // Why it matters for Dekleptocracy:
  //   - Real-time monitoring of corruption-related news
  //   - Cross-references investigative reporting with graph entities
  //   - Surfaces emerging connections not yet in the article corpus
  //
  // How to enable:
  //   1. Choose an API provider from the options above
  //   2. Get an API key if required
  //   3. In extDataConfig.news, set enabled: true and endpoint to the chosen URL
  //   4. Uncomment the fetch function or paste the appropriate fetch function below

  newsMentions: {
    enabled: false,
    endpoint: null,  // Set to chosen provider URL
    queryParams: {
      q: "{nodeName}",
      sortBy: "publishedAt",
      pageSize: 5
    },
    responseFormatter: "formatNewsMentions",
    rateLimit: 60,   // Adjust per provider
    nodeTypes: ["person", "organization", "deal", "jurisdiction", "enforcement"],
    candidateProviders: ["GDELT", "NewsAPI", "MediaCloud"],
    notes: "No provider selected yet. GDELT is recommended for free-tier production use."
  }
};


// ============================================================
// EXAMPLE API RESPONSES
// ============================================================
// These show exactly what data each API returns so formatters
// can be written and tested before connecting live endpoints.

const exampleResponses = {

  // ── FEC Political Donations ──
  // GET https://api.fec.gov/v1/schedules/schedule_a/?contributor_name=Peter+Thiel&sort=-contribution_receipt_amount&per_page=3&api_key=DEMO_KEY
  politicalDonations: {
    api_version: "1.0",
    pagination: {
      count: 47,
      page: 1,
      pages: 5,
      per_page: 10
    },
    results: [
      {
        contributor_name: "THIEL, PETER",
        committee_name: "PROTECT THE MISSION PAC",
        contribution_receipt_amount: 15000000,
        contribution_receipt_date: "2022-06-01",
        contributor_employer: "FOUNDERS FUND",
        contributor_occupation: "INVESTOR",
        contributor_city: "SAN FRANCISCO",
        contributor_state: "CA",
        receipt_type_full: "PAC contribution",
        two_year_transaction_period: 2022
      },
      {
        contributor_name: "THIEL, PETER",
        committee_name: "JD VANCE FOR SENATE",
        contribution_receipt_amount: 2800,
        contribution_receipt_date: "2024-03-15",
        contributor_employer: "FOUNDERS FUND",
        contributor_occupation: "INVESTOR",
        contributor_city: "SAN FRANCISCO",
        contributor_state: "CA",
        receipt_type_full: "Individual contribution",
        two_year_transaction_period: 2024
      },
      {
        contributor_name: "THIEL, PETER",
        committee_name: "SAVE AMERICA PAC",
        contribution_receipt_amount: 1000000,
        contribution_receipt_date: "2024-07-20",
        contributor_employer: "FOUNDERS FUND",
        contributor_occupation: "INVESTOR",
        contributor_city: "LOS ANGELES",
        contributor_state: "CA",
        receipt_type_full: "PAC contribution",
        two_year_transaction_period: 2024
      }
    ]
  },

  // ── FEC Committee Fallback ──
  // GET https://api.fec.gov/v1/committees/?q=Trump+Media&sort=-receipts&per_page=3&api_key=DEMO_KEY
  politicalDonations_committeeFallback: {
    api_version: "1.0",
    pagination: { count: 2, page: 1, pages: 1, per_page: 3 },
    results: [
      {
        name: "TRUMP SAVE AMERICA JOINT FUNDRAISING COMMITTEE",
        committee_id: "C00762591",
        committee_type_full: "Joint fundraising committee",
        state: "VA",
        total_receipts: 250000000,
        total_disbursements: 180000000,
        designation_full: "Joint fundraising committee"
      }
    ]
  },

  // ── SEC EDGAR Corporate Filings ──
  // GET https://efts.sec.gov/LATEST/search-index?q=%22Affinity+Partners%22&dateRange=custom&startdt=2020-01-01
  corporateFilings: {
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
            entity_name: "AFFINITY PARTNERS MANAGEMENT LLC",
            file_date: "2023-09-30",
            form_type: "D/A",
            file_num: "028-12346",
            period_of_report: "2023-09-30",
            file_description: "Amendment to notice of exempt offering"
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
            file_description: "Current report — guilty plea"
          }
        }
      ]
    }
  },

  // ── News Mentions (NewsAPI format) ──
  // GET https://newsapi.org/v2/everything?q=Jared+Kushner&sortBy=publishedAt&pageSize=5
  newsMentions: {
    status: "ok",
    totalResults: 342,
    articles: [
      {
        title: "Kushner's Saudi-Backed Fund Raises Questions About Foreign Influence",
        source: { id: "reuters", name: "Reuters" },
        author: "Investigative Desk",
        publishedAt: "2025-03-10T14:30:00Z",
        url: "https://reuters.com/example-kushner-fund",
        description: "Affinity Partners has received over $2 billion from Saudi PIF and additional commitments from UAE and Qatari sovereign funds."
      },
      {
        title: "Treasury Department Weakens OFAC Enforcement Posture",
        source: { id: "ft", name: "Financial Times" },
        author: "Sanctions Correspondent",
        publishedAt: "2025-02-28T09:00:00Z",
        url: "https://ft.com/example-ofac-weakened",
        description: "OFAC staffing reduced by 30% since January. Crypto enforcement referrals dropped to near zero."
      },
      {
        title: "Binance Seeks Regulatory Rehabilitation Under New Administration",
        source: { id: null, name: "CoinDesk" },
        author: "Crypto Reporter",
        publishedAt: "2025-02-15T16:45:00Z",
        url: "https://coindesk.com/example-binance-rehab",
        description: "Former CEO CZ completed prison sentence. Company now lobbying for reduced monitoring."
      }
    ]
  },

  // ── GDELT News (alternative format) ──
  // GET https://api.gdeltproject.org/api/v2/doc/doc?query=Kushner+Saudi&mode=artlist&format=json
  newsMentions_GDELT: {
    articles: [
      {
        url: "https://example.com/article1",
        title: "Saudi Fund's $2B Kushner Investment Under Congressional Scrutiny",
        seendate: "20250310T140000Z",
        domain: "reuters.com",
        language: "English",
        sourcecountry: "United States"
      }
    ]
  }
};


// ============================================================
// FETCH FUNCTIONS (ready to paste into extDataConfig)
// ============================================================

/**
 * Fetch political donation data from the FEC API.
 * Paste this into extDataConfig.donations.fetch in index.html.
 *
 * @param {string} nodeName - The name of the person to search
 * @returns {Promise<object>} Parsed FEC API response
 */
async function fetchFECDonations(nodeName) {
  const searchName = nodeName
    .replace(/\s*\/.*$/, '')         // Strip "/ CZ" suffix
    .replace(/\s*\(.*?\)/g, '')     // Strip "(Crypto Czar)" parentheticals
    .trim();

  const params = new URLSearchParams({
    contributor_name: searchName,
    sort: '-contribution_receipt_amount',
    per_page: '10',
    api_key: apiConfig.politicalDonations.queryParams.api_key
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);

  try {
    const resp = await fetch(
      apiConfig.politicalDonations.endpoint + '?' + params,
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

/**
 * Fetch corporate filing data from SEC EDGAR.
 * Paste this into extDataConfig.filings.fetch in index.html.
 *
 * @param {string} nodeName - The name of the organization to search
 * @returns {Promise<object>} Parsed EDGAR response
 */
async function fetchSECFilings(nodeName) {
  const params = new URLSearchParams({
    q: '"' + nodeName + '"',
    dateRange: 'custom',
    startdt: apiConfig.corporateFilings.queryParams.startdt
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);

  try {
    const resp = await fetch(
      apiConfig.corporateFilings.endpoint + '?' + params,
      {
        signal: ctrl.signal,
        headers: apiConfig.corporateFilings.requiredHeaders
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

/**
 * Fetch news mentions from GDELT (recommended free provider).
 * Paste this into extDataConfig.news.fetch in index.html.
 *
 * @param {string} nodeName - The name of the entity to search
 * @returns {Promise<object>} Parsed news response (normalized to NewsAPI shape)
 */
async function fetchGDELTNews(nodeName) {
  const params = new URLSearchParams({
    query: nodeName,
    mode: 'artlist',
    format: 'json',
    maxrecords: '5',
    sort: 'DateDesc'
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);

  try {
    const resp = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?' + params,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const raw = await resp.json();

    // Normalize GDELT response to match NewsAPI shape for the formatter
    return {
      articles: (raw.articles || []).map(a => ({
        title: a.title,
        url: a.url,
        publishedAt: a.seendate,
        source: { name: a.domain }
      }))
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}


// ============================================================
// RESPONSE FORMATTER REFERENCE
// ============================================================
// These are the function signatures that extDataConfig.format points to.
// The actual implementations live in index.html under EXTERNAL DATA INTEGRATION.
//
// formatDonations(nodeName, apiResponse) => HTML string
//   - Renders FEC donation rows with committee, amount, date
//   - Falls back to placeholder when apiResponse is null
//
// formatFilings(nodeName, apiResponse) => HTML string
//   - Renders SEC filing rows with form type, entity, date
//   - Falls back to placeholder when apiResponse is null
//
// formatNews(nodeName, apiResponse) => HTML string
//   - Renders news article links with title and date
//   - Falls back to placeholder when apiResponse is null


// ============================================================
// ACTIVATION CHECKLIST
// ============================================================
//
// For a future developer enabling a data source:
//
// [ ] 1. Choose the data source from this config
// [ ] 2. If an API key is required, obtain it:
//         - FEC: https://api.data.gov/signup/ (free, instant)
//         - SEC EDGAR: no key needed
//         - NewsAPI: https://newsapi.org/register (free tier)
//         - GDELT: no key needed
//
// [ ] 3. In index.html, find extDataConfig (search "EXTERNAL DATA INTEGRATION")
//
// [ ] 4. Set the source's enabled property to true:
//         extDataConfig.donations.enabled = true;
//
// [ ] 5. Add the fetch function from this file. Example:
//         extDataConfig.donations.fetch = fetchFECDonations;
//
// [ ] 6. In renderExtDataSlots(), replace the setTimeout stub with:
//         if (cfg.fetch) {
//           cfg.fetch(nd.name)
//             .then(data => { bodyEl.innerHTML = cfg.format(nd.name, data); })
//             .catch(err => {
//               bodyEl.innerHTML = '<div class="sb-ext-error">Data unavailable. ' + err.message + '</div>';
//             });
//         } else {
//           bodyEl.innerHTML = cfg.format(nd.name, null);
//         }
//
// [ ] 7. Test with a known entity (e.g., "Peter Thiel" for FEC,
//         "Trump Media" for SEC EDGAR)
//
// [ ] 8. Check rate limits. The FEC DEMO_KEY allows 30 requests/hour.
//         For production, use a registered key (1000 req/hour).
//
// [ ] 9. Commit and deploy. The slot will automatically appear
//         for the correct node types.
//
// [ ] 10. Monitor the browser console for errors. All fetch functions
//          include AbortController timeouts (9 seconds).
