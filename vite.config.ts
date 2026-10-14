import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 6 applies `define` to client code during `vite build`, not `vite dev`.
// Replace the key here so both commands see the same value.
function injectGeminiKey(apiKey: string): Plugin {
  const replacements: Array<[string, string]> = [
    ['process.env.GEMINI_API_KEY', JSON.stringify(apiKey)],
    ['process.env.API_KEY', JSON.stringify(apiKey)],
  ];
  return {
    name: 'inject-gemini-key',
    transform(code) {
      let next = code;
      let changed = false;
      for (const [from, to] of replacements) {
        if (next.includes(from)) {
          next = next.replaceAll(from, to);
          changed = true;
        }
      }
      return changed ? { code: next, map: null } : undefined;
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.GEMINI_API_KEY ?? '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), injectGeminiKey(geminiApiKey)],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
