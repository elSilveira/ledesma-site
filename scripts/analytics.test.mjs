import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function setup(saved = null) {
  const elements = new Map();
  const scripts = [];
  const window = { localStorage: { getItem: () => saved }, location: { pathname: '/', search: '' } };
  const document = {
    getElementById: (id) => elements.get(id) || null,
    createElement: () => ({ dataset: {}, handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; }, remove() { elements.delete(this.id); } }),
    head: { appendChild(script) { elements.set(script.id, script); scripts.push(script); } },
  };
  const sandboxModule = { exports: {} };
  const source = fs.readFileSync(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { module: sandboxModule, exports: sandboxModule.exports, window, document, Date, Promise, Error, URL });
  return { api: sandboxModule.exports, window, document, scripts };
}

test('uses the established GA4 property rather than the new destination', () => {
  const { api } = setup();
  assert.equal(api.GA_MEASUREMENT_ID, 'G-QZ8X5K9V2R');
});

test('does not send contact events before consent or after rejection', () => {
  for (const consent of [null, 'rejected']) {
    const { api, window } = setup(consent);
    const calls = [];
    window.gtag = (...args) => calls.push(args);
    api.trackContactClick('whatsapp', 'contact_form');
    assert.equal(calls.length, 0);
  }
});

test('sends accepted contact events only to the established property', () => {
  const { api, window } = setup('accepted');
  const calls = [];
  window.gtag = (...args) => calls.push(args);
  api.trackContactClick('whatsapp', 'contact_form');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'click_whatsapp');
  assert.equal(calls[0][2].send_to, 'G-QZ8X5K9V2R');
  assert.deepEqual(Object.keys(calls[0][2]).sort(), ['contact_channel', 'contact_location', 'page_path', 'send_to']);
});

test('preserves denied analytics and advertising consent defaults', () => {
  const { api, window } = setup();
  vm.runInNewContext(api.GOOGLE_CONSENT_DEFAULT_SCRIPT, { window });
  const consent = window.dataLayer[0];
  assert.equal(consent[0], 'consent');
  assert.equal(consent[1], 'default');
  for (const key of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
    assert.equal(consent[2][key], 'denied');
  }
});
