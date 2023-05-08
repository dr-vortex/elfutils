import { context, build } from 'esbuild';

const options = {
	entryPoints: ['src/index.ts'],
	outfile: 'dist/elfutils.min.js',
	minify: true,	
	target: ['es6'],
	sourcemap: true,
	bundle: true,
	format: 'esm',
}

if(['--watch', '-w'].some(flag => process.argv.includes(flag))) {
	const ctx = await context(options);
	await ctx.watch();
}else{
	await build(options);
}