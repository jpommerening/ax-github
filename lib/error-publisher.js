/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { i18n, errors } from 'laxar-patterns';
import { MESSAGES, LOCALE } from './constants';

export default function errorPublisher( context ) {
   const messages = {
      eventBus: context.eventBus,
      features: {
         messages: Object.assign( {}, MESSAGES, context.features.messages || {} )
      },
      i18n: {
         locale: 'default',
         tags: { 'default': LOCALE }
      }
   };
   const localizer = i18n.handlerFor( messages ).localizer();
   return errors.errorPublisherForFeature( messages, 'messages', { localizer } );
}
