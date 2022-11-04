const TYPES = {
  Logger: Symbol.for('Logger'),
  Redis: Symbol.for('Redis'),
  HTTPClient: Symbol.for('HTTPClient'),
  // env vars
  SYNCING_SERVER_JS_URL: Symbol.for('SYNCING_SERVER_JS_URL'),
  AUTH_SERVER_URL: Symbol.for('AUTH_SERVER_URL'),
  PAYMENTS_SERVER_URL: Symbol.for('PAYMENTS_SERVER_URL'),
  FILES_SERVER_URL: Symbol.for('FILES_SERVER_URL'),
  WORKSPACE_SERVER_URL: Symbol.for('WORKSPACE_SERVER_URL'),
  WEB_SOCKET_SERVER_URL: Symbol.for('WEB_SOCKET_SERVER_URL'),
  AUTH_JWT_SECRET: Symbol.for('AUTH_JWT_SECRET'),
  HTTP_CALL_TIMEOUT: Symbol.for('HTTP_CALL_TIMEOUT'),
  VERSION: Symbol.for('VERSION'),
  REDIS_EVENTS_CHANNEL: Symbol.for('REDIS_EVENTS_CHANNEL'),
  CROSS_SERVICE_TOKEN_CACHE_TTL: Symbol.for('CROSS_SERVICE_TOKEN_CACHE_TTL'),
  // Middleware
  StatisticsMiddleware: Symbol.for('StatisticsMiddleware'),
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  WebSocketAuthMiddleware: Symbol.for('WebSocketAuthMiddleware'),
  SubscriptionTokenAuthMiddleware: Symbol.for('SubscriptionTokenAuthMiddleware'),
  // Services
  HTTPService: Symbol.for('HTTPService'),
  CrossServiceTokenCache: Symbol.for('CrossServiceTokenCache'),
  AnalyticsStore: Symbol.for('AnalyticsStore'),
  StatisticsStore: Symbol.for('StatisticsStore'),
  Timer: Symbol.for('Timer'),
  PeriodKeyGenerator: Symbol.for('PeriodKeyGenerator'),
}

export default TYPES
