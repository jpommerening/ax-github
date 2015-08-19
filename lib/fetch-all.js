/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   './parse-links'
], function( parseLinks ) {
   'use strict';

   /**
    * Fetch the given URL and keep following the "next" link
    * until all results are returned.
    * @param {String} url
    * @param {Object} options
    * @return {Promise}
    */
   return function fetchAll( url, options ) {
      return fetch( url, options ).then( function handleResponse( response ) {
         var promise = response.json();
         var links = response.headers.get( 'Link' );
         var next = links && parseLinks( links ).next;

         if( next ) {
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
