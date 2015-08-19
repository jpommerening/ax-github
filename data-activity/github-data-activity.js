/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'laxar-patterns',
   '../lib/handle-auth',
   '../lib/wait-for-event',
   '../lib/extract-pointers',
   '../lib/throttled-publisher',
   '../lib/fetch-all'
], function( patterns, handleAuth, waitForEvent, extractPointers, throttledPublisherForFeature, fetchAll ) {
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
         headers: {}
      };

      var dataPublisher = throttledPublisherForFeature( this, 'data' );

      var ready = handleAuth( eventBus, features, 'auth' )
                     .then( setAuthHeader )
                     .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );

      if( features.data.sources.resource ) {
         patterns.resources.handlerFor( this )
            .registerResourceFromFeature( 'data.sources', {
               onReplace: function( event ) {
                  Promise.all( provideResources( event.data ) ).then( dataPublisher.replace );
               },
               onUpdate: function( event ) {
                  var patches = event.patches.map( mapPatchValue.bind( null, provideResource ) );
                  Promise.all( patches.map( wrapPatchInPromise ) ).then( dataPublisher.update );
               }
            } );
      } else if( features.data.sources.length ) {
         Promise.all( provideResources( features.data.sources ) ).then( dataPublisher.replace );
      }

      var provideActions = features.data.onActions || [];
      var provideHandler = createRequestHandler( eventBus, provideResource );

      provideActions.forEach( function( action ) {
         eventBus.subscribe( 'takeActionRequest.' + action, provideHandler );
      } );

      eventBus.subscribe( 'beginLifecycleRequest', function() {
      } );

      eventBus.subscribe( 'endLifecycleRequest', function() {
      } );

      function setAuthHeader( data ) {
         if( data && data.access_token ) {
            baseOptions.headers[ 'Authorization' ] = 'token ' + data.access_token;
         } else {
            delete baseOptions.headers[ 'Authorization' ];
         }
      }

      function provideResources( sources ) {
         return sources.map( provideResource );
      }

      function provideResource( source ) {
         var options = Object.create( baseOptions );
         var follow = source.follow || features.data.sources.follow;

         return ready.then( function() {
            return extractPointers( source, follow, function( url ) {
               return fetchAll( url, options );
            } );
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

   function createRequestHandler( eventBus, provider ) {
      var OUTCOME_ERROR = patterns.actions.OUTCOME_ERROR;
      var OUTCOME_SUCCESS = patterns.actions.OUTCOME_SUCCESS;

      return function( event ) {
         var action = event.action;
         var data = event.data;
         var resource = data.resource;
         var topic = action + '-' + resource;

         return eventBus.publish( 'willTakeAction.' + topic, {
            action: action,
            data: data
         } ).then( function() {
            return provider( data );
         } ).then( function( data ) {
            return eventBus.publish( 'didReplace.' + resource, {
               resource: resource,
               data: data
            } );
         } ).then( function() {
            return OUTCOME_SUCCESS;
         }, function( error ) {
            console.log( error );
            return OUTCOME_ERROR;
         } ).then( function( outcome ) {
            return eventBus.publish( 'didTakeAction.' + topic + '.' + outcome, {
               action: action,
               outcome: outcome,
               data: data
            } );
         } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: 'github-data-activity',
      create: Controller.create,
      injections: Controller.injections
   };

} );
