'use strict';

/**
 * @module keycloak-client-registration
 */
module.exports = exports = {
  create: create,
  get: get,
  remove: remove,
  update: update
};

const request = require('request'),
  http = require('http'),
  url = require('url'),
  DEFAULT_PROVIDER = 'default';

/**
 * Creates a new keycloak client
 * 
 * @param {object} options - Request options
 * @param {string} options.endpoint - The API endpoint, e.g. http://localhost:8080/auth/realms/master/clients-registrations
 * @param {string} options.accessToken - The [Initial access token]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1473}
 * @param {string} [options.provider=default] - The Keycloak client registration provider to use. Valid values are:
 * <br/>
 *   - 'default': This is the default value and will use [Keycloak client representations]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1507}
 * <br/>
 *   - 'openid-connect': Uses [OpenID Connect Dynamic Client registration]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1527}
 * </br>
 *   - 'saml2-entity-descriptor': Creates clients using [SAML2 entity descriptors]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1537}
 *      as the client representation. 
 * 
 * @param {object} [clientRepresentation] - An object representing the client
 * @param {string} [clientRepresentation.clientId] - The ID of the client to be created when using the 'default' provider
 * @returns {Promise} A promise that will resolve with the client object
 * @instance
 */
function create (opts, clientRepresentation) {
  let options = defaults(opts.accessToken, opts.endpoint, (opts.provider || DEFAULT_PROVIDER));
  options.body = clientRepresentation || {};
  return new Promise((resolve, reject) => {
    request.post(options)
      .on('response', handleResponse(resolve, reject));
  });
}

/**
 * Gets an existing keycloak client
 * 
 * @param {object} options - Request options
 * @param {string} options.endpoint - The API endpoint, e.g. http://localhost:8080/auth/realms/master/clients-registrations
 * @param {string} options.accessToken - The Initial access token @see {@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1473}
 * @param {string} [options.provider=default] - The Keycloak client registration provider to use. Valid values are:
 * <br/>
 *   - 'default': This is the default value and will use [Keycloak client representations]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1507}
 * <br/>
 *   - 'openid-connect': Uses [OpenID Connect Dynamic Client registration]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1527}
 * 
 * @param {string} clientId - The ID of the client to get
 * @returns {Promise} A promise that will resolve with the client object
 * @instance
 */
function get (opts, clientId) {
  let options = defaults(opts.accessToken, opts.endpoint, opts.provider || DEFAULT_PROVIDER, clientId);
  return new Promise((resolve, reject) => {
    request.get(options)
      .on('response', handleResponse(resolve, reject));
  });
}

/**
 * Removes an existing keycloak client
 * 
 * @param {object} options - Request options
 * @param {string} options.endpoint - The API endpoint, e.g. http://localhost:8080/auth/realms/master/clients-registrations
 * @param {string} options.accessToken - The Initial access token @see {@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1473}
 * @param {string} [options.provider=default] - The Keycloak client registration provider to use. Valid values are:
 * <br/>
 *   - 'default': This is the default value and will use [Keycloak client representations]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1507}
 * <br/>
 *   - 'openid-connect': Uses [OpenID Connect Dynamic Client registration]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1527}
 * 
 * @param {string} clientId - The ID of the client to get
 * @returns {Promise} A promise that will resolve with the client object
 * @instance
 */
function remove (opts, clientId) {
  let options = defaults(opts.accessToken, opts.endpoint, opts.provider || DEFAULT_PROVIDER, clientId);
  return new Promise((resolve, reject) => {
    request.delete(options)
      .on('response', handleResponse(resolve, reject));
  });
}

/**
 * Update an existing keycloak client. The client object provided must at a minimum
 * contain a `clientId` property (or `client_id` in the case of OIDC provider). 
 * All other attributes will be applied as an update.
 * 
 * @param {object} options - Request options
 * @param {string} options.endpoint - The API endpoint, e.g. http://localhost:8080/auth/realms/master/clients-registrations
 * @param {string} options.accessToken - The Initial access token @see {@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1473}
 * @param {string} [options.provider=default] - The Keycloak client registration provider to use. Valid values are:
 * <br/>
 *   - 'default': This is the default value and will use [Keycloak client representations]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1507}
 * <br/>
 *   - 'openid-connect': Uses [OpenID Connect Dynamic Client registration]{@link http://keycloak.github.io/docs/userguide/keycloak-server/html/client-registration.html#d4e1527}
 * 
 * @param {object} client - The client to update
 * @param {string} client.clientId
 * @returns {Promise} A promise that will resolve with the client object
 * @instance
 */
function update (opts, client) {
  let options = defaults(opts.accessToken, opts.endpoint, opts.provider || DEFAULT_PROVIDER, client.clientId);
  options.body = client;
  return new Promise((resolve, reject) => {
    request.put(options)
      .on('response', handleResponse(resolve, reject));
  });
}

function handleResponse (resolve, reject) {
  return (res) => {
    const body = [];
    res.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      if (res.statusCode >= 400) {
        return reject(res.statusMessage);
      }
      let result;
      if (res.statusCode === 204) { // No Content
        result = {};
      } else {
        result = JSON.parse(Buffer.concat(body).toString());
      }
      result.headers = res.headers;
      result.statusCode = res.statusCode;
      result.statusMessage = res.statusMessage;
      resolve(result);
    }).on('error', (e) => {
      reject(e);
      console.error(e, e.stack);
    });
  };
}

function defaults (accessToken) {
  const parts = Array.prototype.slice.call(arguments);
  parts.shift(); // get rid of accessToken
  return {
    uri: parts.join('/'),
    json: true,
    auth: {
      bearer: accessToken
    }
  };
}
