var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// functions/_worker.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === "/api/ping") {
      return json({
        status: "ok",
        message: "mendooR API is live",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (url.pathname === "/api/vision") {
      return handleVision(request, env);
    }
    if (url.pathname === "/api/archive") {
      return handleArchive(request);
    }
    if (url.pathname === "/api/websearch") {
      return handleWebSearch(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
async function handleVision(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const image = body && body.image;
  if (!image || typeof image !== "string") {
    return json({ error: 'Missing "image" field (Base64 string expected)' }, 400);
  }
  let apiKey;
  try {
    apiKey = await env.GOOGLE_VISION_API_KEY.get();
  } catch (err) {
    return json({ error: "API key not configured", detail: err.message }, 500);
  }
  if (!apiKey) {
    return json({ error: "API key empty" }, 500);
  }
  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const visionBody = {
    requests: [{
      image: { content: image },
      features: [
        { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }
      ]
      // No languageHints — Google's own documentation is explicit that an
      // empty value gives the BEST results, since it enables full automatic
      // language detection. DOCUMENT_TEXT_DETECTION (used here) auto-detects
      // the complete set of supported languages on its own; a hardcoded
      // hint list would only narrow that down and risk actively hurting
      // detection for any device outside the listed languages — the
      // opposite of what a worldwide-usable scanner needs.
      // Source: docs.cloud.google.com/vision/docs/ocr
    }]
  };
  let visionResp;
  try {
    visionResp = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visionBody)
    });
  } catch (err) {
    return json({ error: "Vision API unreachable", detail: err.message }, 502);
  }
  if (!visionResp.ok) {
    const errText = await visionResp.text().catch(() => "");
    return json({ error: `Vision API error ${visionResp.status}`, detail: errText.slice(0, 500) }, visionResp.status);
  }
  const data = await visionResp.json().catch(() => null);
  if (!data || !Array.isArray(data.responses) || !data.responses[0]) {
    return json({ error: "Empty Vision response", raw: data }, 502);
  }
  const r = data.responses[0];
  if (r.error) {
    return json({ error: "Vision returned error", detail: r.error.message || "unknown", raw: r }, 502);
  }
  if (debug) {
    return json({
      debug: true,
      imageBytes: image.length,
      hasFullTextAnnotation: !!r.fullTextAnnotation,
      hasTextAnnotations: Array.isArray(r.textAnnotations) && r.textAnnotations.length > 0,
      fullText: r.fullTextAnnotation?.text || null,
      textAnnotations: (r.textAnnotations || []).slice(0, 20).map((t) => ({
        description: t.description,
        locale: t.locale
      })),
      rawResponse: r
    });
  }
  const fullText = r.fullTextAnnotation && r.fullTextAnnotation.text || "";
  const words = [];
  const pages = r.fullTextAnnotation && r.fullTextAnnotation.pages || [];
  for (const page of pages) {
    for (const block of page.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const word of paragraph.words || []) {
          const text = (word.symbols || []).map((s) => s.text || "").join("");
          if (!text) continue;
          words.push({
            text,
            confidence: Math.round((word.confidence ?? 0) * 100)
          });
        }
      }
    }
  }
  return json({
    text: fullText.trim(),
    words,
    provider: "google-cloud-vision"
  });
}
__name(handleVision, "handleVision");
function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}
__name(json, "json");
async function handleArchive(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }
  const query = `title:(${q}) AND mediatype:texts`;
  const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description&rows=12&page=1&output=json`;
  let resp;
  try {
    resp = await fetch(archiveUrl, { headers: { "Accept": "application/json" } });
  } catch (err) {
    return json({ error: "Archive.org unreachable", detail: err.message }, 502);
  }
  if (!resp.ok) {
    return json({ error: `Archive.org error ${resp.status}` }, resp.status);
  }
  const data = await resp.json().catch(() => null);
  const docs = data?.response?.docs;
  if (!Array.isArray(docs)) {
    return json({ error: "Unexpected Archive.org response" }, 502);
  }
  const items = docs.filter((d) => d && d.identifier && d.title).map((d) => ({
    identifier: d.identifier,
    title: d.title,
    year: d.year || null,
    url: `https://archive.org/details/${d.identifier}`,
    thumbnail: `https://archive.org/services/img/${d.identifier}`
  }));
  return json({ query: q, count: items.length, items });
}
__name(handleArchive, "handleArchive");
var TRUSTED_DOMAINS = [
  "computerbase.de",
  "chip.de",
  "notebookcheck.net",
  "heise.de",
  "golem.de",
  "pcwelt.de"
];
async function handleWebSearch(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }
  let apiKey;
  try {
    apiKey = await env.TAVILY_API_KEY.get();
  } catch (err) {
    return json({ error: "API key not configured", detail: err.message }, 500);
  }
  if (!apiKey) {
    return json({ error: "API key empty" }, 500);
  }
  const tavilyBody = {
    query: `${q} Reparatur`,
    search_depth: "basic",
    // "advanced" costs 2 credits per call instead of 1
    max_results: 8,
    include_domains: TRUSTED_DOMAINS
  };
  let tavilyResp;
  try {
    tavilyResp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        // NOT api_key in the body — that form is deprecated
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tavilyBody)
    });
  } catch (err) {
    return json({ error: "Tavily unreachable", detail: err.message }, 502);
  }
  if (!tavilyResp.ok) {
    const errText = await tavilyResp.text().catch(() => "");
    return json({ error: `Tavily error ${tavilyResp.status}`, detail: errText.slice(0, 300) }, tavilyResp.status);
  }
  const data = await tavilyResp.json().catch(() => null);
  const results = Array.isArray(data?.results) ? data.results : [];
  const items = results.filter((r) => r && r.url).map((r) => ({
    title: r.title || "Ohne Titel",
    url: r.url,
    snippet: (r.content || "").slice(0, 220)
  }));
  return json({ query: q, count: items.length, items });
}
__name(handleWebSearch, "handleWebSearch");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-N2TwZP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-N2TwZP/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=_worker.js.map
