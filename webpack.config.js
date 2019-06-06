const path = require('path');
const webpack = require('webpack');

let recorderUrl = '';

const config = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/lib',
    library: 'Recorder'
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['babel-plugin-add-module-exports']
          }
        }
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules|sessions/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
  plugins: [

  ]
};

module.exports = (env, argv) => {

  config.plugins.push(
    new webpack.DefinePlugin({
      'RECORDER_URL': JSON.stringify(env.RECORDER_URL)
    })
  );

  if (argv.mode === 'development') {
    config.devtool = 'source-map';
    config.output.filename = 'actions-recorder.js';
    config.devServer = {
      contentBase: config.output.path
    };
  }

  if (argv.mode === 'production') {
    config.output.filename = 'actions-recorder.min.js';
  }

  return config;
};
