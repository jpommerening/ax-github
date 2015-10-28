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
   'es6!../lib/throttled-publisher',
   'es6!../lib/fetch-all'
], function(
   spec,
   constants,
   handleAuth,
   waitForEvent,
   withPatchValue,
   extractPointers,
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

      var publisher = throttledPublisherForFeature( this, 'data' );

      if( features.data.sources.init ) {
         pushQueue( handleReplace, features.data.sources.init );
      }

      if( features.data.sources.resource ) {
         eventBus.subscribe( 'didReplace.' + features.data.sources.resource, function( event ) {
            return pushQueue( handleReplace, event.data );
         } );
         eventBus.subscribe( 'didUpdate.' + features.data.sources.resource, function( event ) {
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

      function handleExpansions() {
      }

      function expand( url, expansion ) {
         var template = URITemplate( url ).parse();
         var variables = template.parts.reduce( function( variables, part ) {
            if( part.variables instanceof Array ) {
               return variables.concat( part.variables );
            }
            return variables;
         }, [] ).map( function( variable ) {
            return variable.name;
         } );
         var parameters = Object.keys( expansion ).reduce( function( parameters, key ) {
            if( variables.indexOf( key ) < 0 ) {
               parameters[ key ] = expansion[ key ];
            }
            return parameters;
         }, {} );

         return URI( template.expand( expansion ) ).query( parameters );
      }

      function provideResources( sources ) {
         return sources.map( provideResource );
      }

      function provideResource( source ) {
         var options = Object.create( baseOptions );
         var fields = features.data.sources.fields;

         return extractPointers( source, fields, function( url ) {
            return url && fetchAll( url, options ).then( null, function( error ) {
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
