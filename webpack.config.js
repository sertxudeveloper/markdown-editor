/* eslint-env node */

const path = require('path');

module.exports = {
  target: 'web',

	entry: path.resolve( __dirname, 'src', 'main.ts' ),

	output: {
		// The name under which the editor will be exported.
		library: 'MarkdownEditor',

		path: path.resolve( __dirname, 'build' ),
		filename: 'MarkdownEditor.js',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},

  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.ts'],
  },

	module: {
		rules: [
			{
				test: /\.svg$/,
				use: ['raw-loader']
			},
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
			},
			{
				test: /\.js$/,
				use: ['babel-loader'],
				exclude: /node_modules/
			},
			{
				test: /\.ts$/,
				use: ['ts-loader'],
				exclude: /node_modules/
			}
		]
	}
};
