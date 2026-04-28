/**
 * Stitch MCP Client — Fetches screen data from Google Stitch
 * Uses Streamable HTTP (MCP 2024-11-05 protocol)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.STITCH_API_KEY || ''; // Set STITCH_API_KEY env var — never commit secrets
const MCP_URL = 'https://stitch.googleapis.com/mcp';
const PROJECT_ID = '13371946978745892776';
const SCREEN_ID = '32adee8359c24348a2a33759e25236a2';
const OUT_DIR = './stitch_output';

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Makes a JSON-RPC request to the Stitch MCP endpoint
 */
async function mcpRequest(method, params, sessionId = null) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  });

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'X-Goog-Api-Key': API_KEY,
  };
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const url = new URL(MCP_URL);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      ...headers,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`[${method}] Status: ${res.statusCode}`);
      console.log(`[${method}] Response Headers:`, JSON.stringify(res.headers, null, 2));

      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        // Extract session ID from response headers
        const respSessionId = res.headers['mcp-session-id'] || null;
        
        // Parse SSE or JSON response
        let parsed = null;
        const contentType = res.headers['content-type'] || '';

        if (contentType.includes('text/event-stream')) {
          // Parse SSE events
          const lines = rawData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                parsed = JSON.parse(line.slice(6));
                break;
              } catch {}
            }
          }
          if (!parsed) {
            console.log('[RAW SSE Response]:', rawData.substring(0, 2000));
          }
        } else {
          try {
            parsed = JSON.parse(rawData);
          } catch {
            console.log('[RAW Response]:', rawData.substring(0, 2000));
          }
        }

        resolve({ data: parsed, sessionId: respSessionId, raw: rawData, status: res.statusCode });
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out after 30s'));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Download a file from a URL and save it
 */
async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    const getter = url.startsWith('https') ? https : https;
    
    const makeRequest = (reqUrl) => {
      getter.get(reqUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          console.log(`  Redirecting to: ${res.headers.location}`);
          makeRequest(res.headers.location);
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  ✅ Saved: ${filename}`);
          resolve(filename);
        });
      }).on('error', (err) => {
        fs.unlink(filename, () => {});
        reject(err);
      });
    };
    makeRequest(url);
  });
}

async function main() {
  console.log('🪡 Stitch MCP Client Starting...\n');

  // STEP 1: Initialize session
  console.log('📡 Step 1: Initialize MCP session...');
  let sessionId = null;
  
  try {
    const initResp = await mcpRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'antigravity-agent', version: '1.0.0' },
    });
    
    sessionId = initResp.sessionId;
    console.log('Session ID:', sessionId);
    
    if (initResp.data) {
      console.log('Init Response:', JSON.stringify(initResp.data, null, 2));
      fs.writeFileSync(`${OUT_DIR}/init_response.json`, JSON.stringify(initResp.data, null, 2));
    } else {
      console.log('Raw init response saved to file');
      fs.writeFileSync(`${OUT_DIR}/init_raw.txt`, initResp.raw);
    }
  } catch (err) {
    console.error('Init failed:', err.message);
    // Try proceeding without session ID
  }

  // STEP 2: Send initialized notification
  if (sessionId) {
    console.log('\n📡 Step 2: Send initialized notification...');
    try {
      await mcpRequest('notifications/initialized', {}, sessionId);
    } catch (err) {
      console.log('Notification (non-critical):', err.message);
    }
  }

  // STEP 3: Call get_screen tool
  console.log('\n📡 Step 3: Call get_screen tool...');
  try {
    const screenResp = await mcpRequest('tools/call', {
      name: 'get_screen',
      arguments: {
        project_id: PROJECT_ID,
        screen_id: SCREEN_ID,
      },
    }, sessionId);

    console.log('get_screen Status:', screenResp.status);
    
    if (screenResp.data) {
      console.log('\n📦 Screen Data:');
      console.log(JSON.stringify(screenResp.data, null, 2));
      fs.writeFileSync(`${OUT_DIR}/screen_data.json`, JSON.stringify(screenResp.data, null, 2));
      
      // Extract URLs from response
      const result = screenResp.data?.result;
      const content = result?.content;
      
      if (content && Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'text') {
            console.log('\n📄 Screen Text Content:');
            console.log(item.text);
            fs.writeFileSync(`${OUT_DIR}/screen_content.txt`, item.text);
            
            // Try to parse JSON from the text
            try {
              const parsed = JSON.parse(item.text);
              fs.writeFileSync(`${OUT_DIR}/screen_parsed.json`, JSON.stringify(parsed, null, 2));
              
              // Download image if URL present
              const imageUrl = parsed.imageUrl || parsed.screenshotUrl || parsed.image_url;
              if (imageUrl) {
                console.log('\n🖼️  Downloading screen image...');
                await downloadFile(imageUrl, `${OUT_DIR}/screen_preview.png`);
              }
              
              // Download HTML if URL present  
              const htmlUrl = parsed.htmlUrl || parsed.codeUrl || parsed.html_url;
              if (htmlUrl) {
                console.log('\n💻 Downloading HTML code...');
                await downloadFile(htmlUrl, `${OUT_DIR}/screen_code.html`);
              }

              // Save inline HTML if present
              const html = parsed.html || parsed.code || parsed.htmlContent;
              if (html) {
                console.log('\n💻 Saving inline HTML code...');
                fs.writeFileSync(`${OUT_DIR}/screen_code.html`, html);
                console.log(`  ✅ Saved: ${OUT_DIR}/screen_code.html`);
              }
            } catch {
              // Text is not JSON, could be HTML directly
              if (item.text.trim().startsWith('<')) {
                fs.writeFileSync(`${OUT_DIR}/screen_code.html`, item.text);
                console.log(`  ✅ Saved HTML: ${OUT_DIR}/screen_code.html`);
              }
            }
          }
          if (item.type === 'image') {
            console.log('\n🖼️  Found image in response, saving...');
            if (item.data) {
              const imgBuffer = Buffer.from(item.data, 'base64');
              fs.writeFileSync(`${OUT_DIR}/screen_preview.png`, imgBuffer);
              console.log(`  ✅ Saved image: ${OUT_DIR}/screen_preview.png`);
            }
            if (item.url) {
              await downloadFile(item.url, `${OUT_DIR}/screen_preview.png`);
            }
          }
        }
      }
    } else {
      console.log('Raw response:', screenResp.raw?.substring(0, 3000));
      fs.writeFileSync(`${OUT_DIR}/screen_raw.txt`, screenResp.raw || '');
    }
  } catch (err) {
    console.error('get_screen failed:', err.message);
  }

  console.log(`\n✅ Done! Check ${OUT_DIR}/ for all outputs.`);
}

main().catch(console.error);
