import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['backend/index.ts'],
	dts: true,
	format: ['cjs', 'esm'],
	target: 'es2022',
	clean: true,
	tsconfig: 'backend/tsconfig.json', // Use your frontend-specific tsconfig
	esbuildOptions(options) {
		// Prevent potential issues with injected options
		options.define = {
			'process.env.NODE_ENV': '"production"',
		};
	},
});
