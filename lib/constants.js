/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

export const API_VERSION = 'v3';
export const MEDIA_TYPE = `application/vnd.github.${API_VERSION}+json`;
export const CUSTOM_MEDIA_TYPES = {
   raw: `application/vnd.github.${API_VERSION}.raw`,
   html: `application/vnd.github.${API_VERSION}.html`
};
export const AUTH_HEADER_NAME = 'Authorization';
export const AUTH_HEADER_VALUE = 'token [access_token]';
export const LOCALE = 'en';
export const I18N = {
   locale: 'default',
   tags: { 'default': LOCALE }
};
export const MESSAGES = {
   i18nFailedLoadingResource: {
      en: 'Failed loading resource "[url]".'
   },
   i18nEncounteredSocketIOError: {
      en: 'Encountered socket.io error.'
   }
};
