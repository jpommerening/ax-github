/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
define( [
   'laxar-patterns',
   '../lib/handle-auth',
   '../lib/wait-for-event',
   '../lib/fetch-all'
], function( patterns, handleAuth, waitForEvent, fetchAll ) {
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

      var publisher = features.user.resource && patterns.resources.replacePublisherForFeature( this, 'user' ) || function() {};

      var baseOptions = {
         method: 'GET',
         headers: {}
      };

      var user = ready.then( function() {
         var options = Object.create( baseOptions );
         var url = features.user.url;
         return fetch( url, options );
      } ).then( function( response ) {
         return response.json();
      } ).then( function( user ) {
         console.log( 'got', 'user', user );
         publisher( user );
         return user;
      } );

      [
         'repos',
         'orgs',
         'keys',
         'followers',
         'following',
         'stars'
      ].filter( function( feature ) {
         return !!( features[ feature ] && features[ feature ].resource );
      } ).forEach( function( feature ) {
         var context = {
            eventBus: eventBus,
            features: features
         };
         var publisher = patterns.resources.replacePublisherForFeature( context, feature );

         user.then( function( user ) {
            var options = Object.create( baseOptions );
            var args = encodeArguments( features[ feature ] );
            var url = user.url + '/' + feature + ( args.length ? '?' + args.join( '&' ) : '' );
            console.log( 'fetch', feature, url );
            return fetchAll( url, options );
         } ).then( function( data ) {
            console.log( 'got', feature, data );
            publisher( data );
            return data;
         } );
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

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function encodeArguments( object ) {
      return Object.keys( object ).filter( function( key ) {
         return typeof key !== 'undefined' && key !== 'resource';
      } ).map( function( key ) {
         return encodeURIComponent( key ) + '=' + encodeURIComponent( object[ key ] );
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      name: 'github-userdata-activity',
      create: Controller.create,
      injections: Controller.injections
   };

} );
