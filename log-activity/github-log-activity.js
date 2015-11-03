/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'json!./widget.json',
   'es6!../lib/resource-flattener',
   'es6!../lib/constants',
   'es6!../lib/handle-auth',
   'es6!../lib/wait-for-event',
   'es6!../lib/with-patch-value',
   'es6!../lib/extract-pointers',
   'es6!../lib/expand-url',
   'es6!../lib/throttled-publisher',
   'es6!../lib/fetch-all'
], function(
   spec,
   resourceFlattener,
   constants,
   handleAuth,
   waitForEvent,
   withPatchValue,
   extractPointers,
   expandUrl,
   throttledPublisherForFeature,
   fetchAll
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
            Accept: constants.MEDIA_TYPE
         }
      };

      var queue = handleAuth( eventBus, features, 'auth' )
                     .then( handleAuth.setAuthHeader( baseOptions.headers ) )
                     .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );

      var publisher = resourceFlattener().wrap( throttledPublisherForFeature( this, 'log' ) );

      if( features.log.sources.init ) {
         pushQueue( handleReplace, features.log.sources.init );
      }

      if( features.log.sources.resource ) {
         eventBus.subscribe( 'didReplace.' + features.log.sources.resource, function( event ) {
            return pushQueue( handleReplace, event.data );
         } );
         eventBus.subscribe( 'didUpdate.' + features.log.sources.resource, function( event ) {
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

      var stop = stopOnKnownCommit();

      function provideResource( source ) {
         var options = Object.create( baseOptions );
         var fields = features.log.sources.fields;

         return extractPointers( source, fields, function( url ) {
            /* temporary hack: simulate the future "log-activity", instead we should use proper expansion */
            var match = /^(.*\/commits)\/([0-9a-f]+)$/.exec( url || '' );
            if( match ) {
               var sha = match[ 2 ];
               url = match[1] + '?sha=' + sha;
            }
            /* hack end */
            return url && fetchAll( url, options, match && stop ).then( null, function( error ) {
               publisher.error( 'HTTP_GET', 'i18nFailedLoadingResource', { url: url }, error );
               return null;
            } );
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function stopOnKnownCommit() {
      var commits = {};
      return function( json ) {
         return json.then( function( data ) {
            for( var i = 0; i < data.length; i++ ) {
               var sha = data[ i ].sha;
               if( commits[ sha ] ) {
                  return true;
               }
               commits[ sha ] = true;
            }
            return false;
         } );
      }
   }

   return {
      name: spec.name,
      create: Controller.create,
      injections: Controller.injections
   };

} );
