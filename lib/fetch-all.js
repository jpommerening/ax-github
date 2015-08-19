/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   './parse-links'
], function( parseLinks ) {

   return function fetchAll( url, options ) {
      console.log( 'fetch all ');
      return fetch( url, options )
         .then( function handleResponse( response ) {
            var promise = response.json();
            var links = response.headers.get( 'Link' );
            var next = links && parseLinks( links ).next;

            if( next ) {
               console.log ('next', next);
               return fetch( next, options )
                  .then( handleResponse )
                  .then( function( tail ) {
                     return promise.then( function( head ) {
                        return head.concat( tail );
                     } );
                  } );
            } else {
               return promise;
            }
         } );
   }

} );
