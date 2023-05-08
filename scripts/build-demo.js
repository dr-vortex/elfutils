import { context, build } from 'esbuild';

const options = {
	entryPoints: ['src/demo/app.ts', 'src/demo/index.html'],
	outdir: 'dist/demo',
	target: ['es6'],
	sourcemap: true,
	bundle: true,
	minify: true,
	loader: {
		'.html': 'copy'
	}
}
if(['--watch', '-w'].some(flag => process.argv.includes(flag))) {
	const ctx = await context(options);
	await ctx.watch();
	const { host, port } = await ctx.serve({ servedir: 'dist/demo' });
	console.log(`Serving demo at ${host}:${port}`);
}else{
	await build(options);
}