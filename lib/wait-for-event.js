/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( function() {

   return function waitForEvent( eventBus, event ) {
      var promise = new Promise( function( resolve, reject ) {
         eventBus.subscribe( event, function wait() {
            eventBus.unsubscribe( wait );
            resolve();
         } );
      } );

      return function() {
         return promise;
      };
   }

} );
