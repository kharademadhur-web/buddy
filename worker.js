export default {
  async fetch(request, env) {
    // First try to serve the static asset
    let response = await env.ASSETS.fetch(request);

    // If not found and this looks like a navigation request, fall back to index.html (SPA)
    const accept = request.headers.get("accept") || "";
    if (response.status === 404 && accept.includes("text/html")) {
      const url = new URL(request.url);
      const indexReq = new Request(new URL("/index.html", url.origin), request);
      return await env.ASSETS.fetch(indexReq);
    }

    return response;
  }
};
