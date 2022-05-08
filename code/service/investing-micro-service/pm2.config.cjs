const path = require('path');

module.exports = {
  apps: ['binance-wallet', 'boge'].map(name => ({
    name,
    cwd: path.resolve(__dirname, `./process/${name}`),
    script: './index.js',
    watch: ['.', '../../node_modules'],
    instance_var: 'INSTANCE_ID',
    env: {
      NODE_ENV: 'development',
      NODE_PATH: path.resolve(__dirname, './node_modules'),
    },
  })),
};
