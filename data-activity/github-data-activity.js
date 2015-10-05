/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'es6!../lib/handle-auth',
   'es6!../lib/wait-for-event',
   'es6!../lib/extract-pointers',
   'es6!../lib/throttled-publisher',
   'es6!../lib/fetch-all'
], function( handleAuth, waitForEvent, extractPointers, throttledPublisherForFeature, fetchAll ) {
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

      var ready = handleAuth( eventBus, features, 'auth' )
                     .then( setAuthHeader )
                     .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );
      var queue = ready;

      var publisher = throttledPublisherForFeature( this, 'data' );

      var baseOptions = {
         method: 'GET',
         headers: {
            Accept: 'application/vnd.github.v3+json'
         }
      };

      if( features.data.sources.resource ) {
         eventBus.subscribe( 'didReplace.' + features.data.sources.resource, function( event ) {
            return pushQueue( handleReplace, event.data );
         } );
         eventBus.subscribe( 'didUpdate.' + features.data.sources.resource, function( event ) {
            return pushQueue( handleUpdate, event.patches );
         } );
      } else if( features.data.sources.init ) {
         pushQueue( handleReplace, features.data.sources.init );
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

      function setAuthHeader( data ) {
         if( data && data.access_token ) {
            baseOptions.headers[ 'Authorization' ] = 'token ' + data.access_token;
         } else {
            delete baseOptions.headers[ 'Authorization' ];
         }
      }

      function handleReplace( data ) {
         return Promise.all( provideResources( data ) ).then( publisher.replace );
      }

      function handleUpdate( patches ) {
         patches = patches.map( mapPatchValue.bind( null, provideResource ) );
         return Promise.all( patches.map( wrapPatchInPromise ) ).then( publisher.update );
      }

      function provideResources( sources ) {
         return sources.map( provideResource );
      }

      function provideResource( source ) {
         var options = Object.create( baseOptions );
         var follow = features.data.sources.follow;

         return extractPointers( source, follow, function( url ) {
            return url && fetchAll( url, options );
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function mapPatchValue( callback, patch ) {
      var result = {
         op: patch.op,
         path: patch.path
      };
      if( patch.from ) {
         result.from = patch.from;
      }
      if( patch.value ) {
         result.value = callback( patch.value );
      }
      return result;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function wrapPatchInPromise( patch ) {
      if( patch.value ) {
         return patch.value.then( function( value ) {
            return mapPatchValue( function() {
               return value;
            }, patch );
         } );
      } else {
         return Promise.resolve( patch );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: 'github-data-activity',
      create: Controller.create,
      injections: Controller.injections
   };

} );
