var PROXY_CONFIG = [
  {
    context: [
      "/login",
      "/logout",
      "/currentuser",
      "/api",
      "/openapi",
      "/ws",
      "/healthz"
    ],
    target: "http://localhost:8080",
    secure: false,
    changeOrigin: true
  }
];

module.exports = PROXY_CONFIG;
