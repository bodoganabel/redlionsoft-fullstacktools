const sveltePreprocess = require('svelte-preprocess');

module.exports = {
  preprocess: sveltePreprocess({
    typescript: {
      // TypeScript options are passed to the TypeScript compiler
    },
  }),
};