import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['common/index.ts'],
	dts: true,
	format: ['cjs', 'esm'],
	target: 'es2022',
	clean: true,
	tsconfig: 'common/tsconfig.json', // Use your backend-specific tsconfig
	esbuildOptions(options) {
		// Prevent potential issues with injected options
		options.define = {
			'process.env.NODE_ENV': '"production"',
		};
	},
});
