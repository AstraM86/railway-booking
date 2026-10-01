import { defineConfig, loadEnv, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/.*\.js$/)) {
      return null;
    }
    return await transformWithOxc(code, id, { lang: 'jsx' });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const define = {};
  for (const key in env) {
    define[`process.env.${key}`] = JSON.stringify(env[key]);
  }

  return {
    plugins: [react(), transformJsxInJs()],
    define,
    base: '/railway-booking/',
    optimizeDeps: {
      include: ['rc-picker/es/generate/dayjs'],
    },
  };
});
