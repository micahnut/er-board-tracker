import { mkdir, writeFile } from 'node:fs/promises';

const server = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    return env.ASSETS.fetch(new Request(url.origin + "/index.html", request));
  }
};
`;

await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', server);
