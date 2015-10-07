/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

export const MIME_TYPE = 'application/vnd.github.v3+json';
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
