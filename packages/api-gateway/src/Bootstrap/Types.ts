export const TYPES = {
  ApiGateway_Logger: Symbol.for('ApiGateway_Logger'),
  ApiGateway_Redis: Symbol.for('ApiGateway_Redis'),
  ApiGateway_HTTPClient: Symbol.for('ApiGateway_HTTPClient'),
  // env vars
  ApiGateway_SYNCING_SERVER_JS_URL: Symbol.for('ApiGateway_SYNCING_SERVER_JS_URL'),
  ApiGateway_AUTH_SERVER_URL: Symbol.for('ApiGateway_AUTH_SERVER_URL'),
  ApiGateway_PAYMENTS_SERVER_URL: Symbol.for('ApiGateway_PAYMENTS_SERVER_URL'),
  ApiGateway_FILES_SERVER_URL: Symbol.for('ApiGateway_FILES_SERVER_URL'),
  ApiGateway_REVISIONS_SERVER_URL: Symbol.for('ApiGateway_REVISIONS_SERVER_URL'),
  ApiGateway_EMAIL_SERVER_URL: Symbol.for('ApiGateway_EMAIL_SERVER_URL'),
  ApiGateway_WEB_SOCKET_SERVER_URL: Symbol.for('ApiGateway_WEB_SOCKET_SERVER_URL'),
  ApiGateway_AUTH_JWT_SECRET: Symbol.for('ApiGateway_AUTH_JWT_SECRET'),
  ApiGateway_HTTP_CALL_TIMEOUT: Symbol.for('ApiGateway_HTTP_CALL_TIMEOUT'),
  ApiGateway_VERSION: Symbol.for('ApiGateway_VERSION'),
  ApiGateway_CROSS_SERVICE_TOKEN_CACHE_TTL: Symbol.for('ApiGateway_CROSS_SERVICE_TOKEN_CACHE_TTL'),
  ApiGateway_IS_CONFIGURED_FOR_HOME_SERVER: Symbol.for('ApiGateway_IS_CONFIGURED_FOR_HOME_SERVER'),
  // Middleware
  ApiGateway_RequiredCrossServiceTokenMiddleware: Symbol.for('ApiGateway_RequiredCrossServiceTokenMiddleware'),
  ApiGateway_OptionalCrossServiceTokenMiddleware: Symbol.for('ApiGateway_OptionalCrossServiceTokenMiddleware'),
  ApiGateway_WebSocketAuthMiddleware: Symbol.for('ApiGateway_WebSocketAuthMiddleware'),
  ApiGateway_SubscriptionTokenAuthMiddleware: Symbol.for('ApiGateway_SubscriptionTokenAuthMiddleware'),
  // Services
  ApiGateway_ServiceProxy: Symbol.for('ApiGateway_ServiceProxy'),
  ApiGateway_CrossServiceTokenCache: Symbol.for('ApiGateway_CrossServiceTokenCache'),
  ApiGateway_Timer: Symbol.for('ApiGateway_Timer'),
  ApiGateway_EndpointResolver: Symbol.for('ApiGateway_EndpointResolver'),
}
