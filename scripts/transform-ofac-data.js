#!/usr/bin/env node
/**
 * transform-ofac-data.js
 *
 * Downloads the OFAC SDN dataset from OpenSanctions and transforms it
 * into the sdn_list.json format used by the Dekleptocracy Explorer.
 *
 * Data source: https://www.opensanctions.org/datasets/us_ofac_sdn/
 * Format: FollowTheMoney (FtM) entities in newline-delimited JSON
 *
 * Run manually:   node scripts/transform-ofac-data.js
 * Run via CI:     Triggered by .github/workflows/update-ofac-sdn.yml
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_URL = 'https://data.opensanctions.org/datasets/latest/us_ofac_sdn/entities.ftm.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'sdn_list.json');
const TIMEOUT_MS = 60000;

function fetch(url) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error('Download timed out after ' + TIMEOUT_MS + 'ms')); }, TIMEOUT_MS);
    var proto = url.startsWith('https') ? require('https') : require('http');
    proto.get(url, { headers: { 'User-Agent': 'DekleptocracyExplorer/1.0 (github.com/th4449/dekleptocracy-explorer)' } }, function(res) {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        fetch(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        clearTimeout(timer);
        reject(new Error('HTTP ' + res.statusCode + ' from ' + url));
        return;
      }
      var chunks = [];
      res.on('data', function(chunk) { chunks.push(chunk); });
      res.on('end', function() {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      res.on('error', function(err) { clearTimeout(timer); reject(err); });
    }).on('error', function(err) { clearTimeout(timer); reject(err); });
  });
}

function getProp(entity, key) {
  if (!entity.properties || !entity.properties[key]) return [];
  return entity.properties[key];
}

function getFirst(entity, key) {
  var vals = getProp(entity, key);
  return vals.length > 0 ? vals[0] : '';
}

function transformEntity(entity) {
  var schema = entity.schema || '';
  var entityType = 'Unknown';
  if (schema === 'Person' || schema === 'LegalEntity') {
    entityType = schema === 'Person' ? 'Individual' : 'Entity';
  } else if (schema === 'Company' || schema === 'Organization') {
    entityType = 'Entity';
  } else if (schema === 'Vessel' || schema === 'Airplane' || schema === 'Crypto') {
    entityType = 'Entity';
  } else {
    entityType = 'Entity';
  }

  // Extract name parts
  var firstName = getFirst(entity, 'firstName') || '';
  var lastName = getFirst(entity, 'lastName') || getFirst(entity, 'name') || '';

  // If no firstName/lastName split, use full name as lastName
  if (!firstName && !lastName) {
    lastName = (getProp(entity, 'name')[0] || entity.caption || 'Unknown');
  }

  // Programs and topics
  var topics = getProp(entity, 'topics');
  var programs = getProp(entity, 'program');
  var program = programs.length > 0 ? programs[0] : (topics.length > 0 ? topics[0] : '');

  // Remarks and notes
  var notes = getProp(entity, 'notes');
  var summary = getFirst(entity, 'summary') || getFirst(entity, 'description');
  var remark = notes.length > 0 ? notes[0] : summary;

  // Start date (designation date)
  var startDate = getFirst(entity, 'createdAt') || getFirst(entity, 'modifiedAt') || '';

  // Addresses
  var addresses = [];
  var country = getFirst(entity, 'country');
  var addr = getFirst(entity, 'address');
  if (country || addr) {
    addresses.push({
      address1: addr || '',
      city: '',
      country: country || ''
    });
  }

  // Aliases
  var aliases = getProp(entity, 'alias');
  var weakAliases = getProp(entity, 'weakAlias');
  var allAliases = aliases.concat(weakAliases);
  var alts = allAliases.slice(0, 5).map(function(a) {
    return { firstName: '', lastName: a };
  });

  return {
    uid: entity.id || '',
    firstName: firstName,
    lastName: lastName,
    entityType: entityType,
    program: program.toUpperCase(),
    programList: 'SDN',
    remark: remark ? remark.slice(0, 500) : '',
    startDate: startDate ? startDate.slice(0, 10) : '',
    addresses: addresses,
    alts: alts
  };
}

async function main() {
  console.log('[OFAC Transform] Downloading OFAC SDN data from OpenSanctions...');
  console.log('[OFAC Transform] URL: ' + DATA_URL);

  var raw;
  try {
    raw = await fetch(DATA_URL);
  } catch (err) {
    console.error('[OFAC Transform] Download failed: ' + err.message);
    process.exit(1);
  }

  console.log('[OFAC Transform] Download complete. Parsing entities...');

  // Parse newline-delimited JSON
  var lines = raw.split('\n').filter(function(line) { return line.trim().length > 0; });
  console.log('[OFAC Transform] Raw lines: ' + lines.length);

  var entities = [];
  var parseErrors = 0;
  lines.forEach(function(line, i) {
    try {
      entities.push(JSON.parse(line));
    } catch (e) {
      parseErrors++;
      if (parseErrors <= 3) console.warn('[OFAC Transform] Parse error on line ' + (i + 1) + ': ' + e.message);
    }
  });

  if (parseErrors > 3) {
    console.warn('[OFAC Transform] ' + parseErrors + ' total parse errors (showing first 3)');
  }

  console.log('[OFAC Transform] Parsed ' + entities.length + ' entities. Transforming...');

  // Filter to sanctioned entities (skip non-entity schemas like Sanctions, Positions, etc.)
  var validSchemas = ['Person', 'LegalEntity', 'Company', 'Organization', 'Vessel', 'Airplane', 'CryptoWallet'];
  var sanctioned = entities.filter(function(e) {
    return validSchemas.indexOf(e.schema) !== -1;
  });

  console.log('[OFAC Transform] ' + sanctioned.length + ' sanctioned entities after filtering.');

  // Transform to target format
  var sdnList = sanctioned.map(transformEntity);

  // Validate: ensure we got a reasonable number of entries
  if (sdnList.length < 100) {
    console.error('[OFAC Transform] ERROR: Only ' + sdnList.length + ' entries found. Expected 10,000+. Data may be corrupted or API format changed.');
    process.exit(1);
  }

  // Build output
  var output = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    source: 'OpenSanctions OFAC SDN dataset',
    sourceUrl: 'https://www.opensanctions.org/datasets/us_ofac_sdn/',
    entryCount: sdnList.length,
    sdnList: sdnList
  };

  // Write output
  var json = JSON.stringify(output, null, 2);
  fs.writeFileSync(OUTPUT_PATH, json, 'utf8');

  var sizeMB = (Buffer.byteLength(json) / 1048576).toFixed(1);
  console.log('[OFAC Transform] Written ' + OUTPUT_PATH);
  console.log('[OFAC Transform] Entries: ' + sdnList.length);
  console.log('[OFAC Transform] File size: ' + sizeMB + ' MB');
  console.log('[OFAC Transform] Done.');
}

main().catch(function(err) {
  console.error('[OFAC Transform] Fatal error: ' + err.message);
  process.exit(1);
});
