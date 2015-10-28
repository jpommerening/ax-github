/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'json!./widget.json',
   'es6!../lib/constants',
   'es6!../lib/handle-auth',
   'es6!../lib/wait-for-event',
   'es6!../lib/with-patch-value',
   'es6!../lib/extract-pointers',
   'es6!../lib/throttled-publisher'
], function(
   spec,
   constants,
   handleAuth,
   waitForEvent,
   withPatchValue,
   extractPointers,
   throttledPublisherForFeature
) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.injections = [ 'axEventBus', 'axFeatures' ];

   Controller.create = function create( eventBus, features ) {
      return new Controller( eventBus, features );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function Controller( eventBus, features ) {
      this.eventBus = eventBus;
      this.features = features;

      var baseOptions = {
         method: 'GET',
         headers: {
            Accept: constants.CUSTOM_MEDIA_TYPES[ features.contents.type ] || constants.MEDIA_TYPE
         }
      };

      var queue = handleAuth( eventBus, features, 'auth' )
                     .then( handleAuth.setAuthHeader( baseOptions.headers ) )
                     .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );

      var publisher = throttledPublisherForFeature( this, 'contents' );

      if( features.contents.sources.init ) {
         pushQueue( handleReplace, features.contents.sources.init );
      }

      if( features.contents.sources.resource ) {
         eventBus.subscribe( 'didReplace.' + features.contents.sources.resource, function( event ) {
            return pushQueue( handleReplace, event.data );
         } );
         eventBus.subscribe( 'didUpdate.' + features.contents.sources.resource, function( event ) {
            return pushQueue( handleUpdate, event.patches );
         } );
      }

      eventBus.subscribe( 'beginLifecycleRequest', function() {
      } );

      eventBus.subscribe( 'endLifecycleRequest', function() {
      } );

      function pushQueue( callback ) {
         var args = [].slice.call( arguments, 1 );
         return queue = queue.then( function() {
            return callback.apply( null, args );
         } );
      }

      function handleReplace( data ) {
         return Promise.all( provideResources( data ) ).then( publisher.replace );
      }

      function handleUpdate( patches ) {
         return Promise.all( patches.map( withPatchValue( provideResource ) ) ).then( publisher.update );
      }

      function provideResources( sources ) {
         return sources.map( provideResource );
      }

      function provideResource( source ) {
         var options = Object.create( baseOptions );
         var fields = features.contents.sources.fields;
         var path = features.contents.path;

         return extractPointers( source, fields, function( url ) {
            if( !url ) return null;

            return fetch( url.replace( /\{\+path\}$/, path ), options ).then( function( response ) {
               if( response.headers.get( 'Content-Type' ).match( /.*\.json/ ) ) {
                  return response.json();
               } else {
                  return response.text();
               }
            }, function( error ) {
               publisher.error( 'HTTP_GET', 'i18nFailedLoadingResource', { url: url }, error );
               return null;
            } );
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: spec.name,
      create: Controller.create,
      injections: Controller.injections
   };

} );
