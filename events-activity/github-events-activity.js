/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'laxar-patterns',
   'es6!../lib/handle-auth',
   'es6!../lib/wait-for-event',
   'es6!../lib/extract-pointers',
   'es6!../lib/throttled-publisher',
   './http-event-stream',
   './socket-event-stream',
], function( patterns, handleAuth, waitForEvent, extractPointers, throttledPublisherForFeature, HttpEventStream, SocketEventStream ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var EventStream = {
      'http': HttpEventStream,
      'https': HttpEventStream,
      'ws': SocketEventStream,
      'wss': SocketEventStream
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   Controller.injections = [ 'axEventBus', 'axFeatures' ];

   Controller.create = function create( eventBus, features ) {
      return new Controller( eventBus, features );
   };

   function Controller( eventBus, features ) {
      this.eventBus = eventBus;
      this.features = features;

      var streams = [];
      var ready = handleAuth( eventBus, features, 'auth' )
                     .then( setAuthHeader )
                     .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );

      var publisher = throttledPublisherForFeature( this, 'events' );

      var baseOptions = {
         headers: {
            Accept: 'application/vnd.github.v3+json'
         },
         onEvent: deduplicate( publisher.push ),
         onError: eventBus.publish.bind( eventBus, 'didEncounterError.GITHUB_EVENTS' )
      };

      if( features.events.sources.resource ) {
         patterns.resources.handlerFor( this )
            .registerResourceFromFeature( 'events.sources', {
               onReplace: function( event ) {
                  return handleReplace( event.data );
               },
               onUpdate: function( event ) {
                  return handleUpdate( event.patches );
               }
            } );
      } else if( features.events.sources.init ) {
         handleReplace( features.events.sources.init );
      }

      eventBus.subscribe( 'beginLifecycleRequest', function() {
      } );

      eventBus.subscribe( 'endLifecycleRequest', function() {
         disconnectStreams( streams );
      } );

      function setAuthHeader( data ) {
         if( data && data.access_token ) {
            baseOptions.headers[ 'Authorization' ] = 'token ' + data.access_token;
         } else {
            delete baseOptions.headers[ 'Authorization' ];
         }
      }

      function handleReplace( data ) {
         disconnectStreams( streams );
         streams = [];

         return ready.then( function() {
            publisher.replace( [] );
            return Promise.all( streams = provideStreams( data ) );
         } );
      }

      function handleUpdate( patches ) {
         var promises = [];
         var patches = event.patches.map( mapPatchValue.bind( null, function( source ) {
            var promise = provideStream( source );
            promises.push( promise );
            return promise;
         } ) );
         var removed = removedItems( streams, patches );
         disconnectStreams( removed );
         publisher.update( [] ); // TODO: determine removed indexes?
         patterns.json.applyPatch( streams, patches );
         return Promise.all( promises );
      }

      function provideStreams( sources ) {
         return sources.map( provideStream );
      }

      function provideStream( source ) {
         var options = Object.create( baseOptions );
         var follow = features.events.sources.follow;

         options.events = source.events;

         return ready.then( function() {
            return extractPointers( source, follow, function( url ) {
               var match = /^(https?|wss?):/.exec( url );
               var type = source.type || match[ 1 ];
               var stream = new EventStream[ type ]( options );
               stream.connect( url );
               return stream;
            } );
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function removedItems( items, patches ) {
      return patches.filter( function( patch ) {
         return ( patch.op === 'remove' || patch.op === 'replace' );
      } ).map( function( patch ) {
         return patterns.json.getPointer( items, patch.path );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function disconnectStreams( streams ) {
      return Promise.all( streams ).then( function( streams ) {
         streams.forEach( function( stream ) {
            stream.disconnect();
         } );
      } );
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

   function deduplicate( callback ) {
      var idx = 0;
      var ids = {};
      return function( event ) {
         if( event.id ) {
            if( event.id in ids ) {
               return;
            }
            ids[ event.id ] = idx++;
         }
         return callback( event );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: 'github-events-activity',
      create: Controller.create,
      injections: Controller.injections
   };

} );
