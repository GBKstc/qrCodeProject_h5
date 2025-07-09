const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://175.24.15.119:10019',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // 保留 /api 前缀
      },
      onError: function(err, req, res) {
        console.error('代理错误:', err);
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('代理请求:', req.method, req.url);
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log('代理响应:', proxyRes.statusCode, req.url);
      }
    })
  );
};