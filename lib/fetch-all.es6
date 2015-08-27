/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import parseLinks from './parse-links';

/**
 * Fetch the given URL and keep following the "next" link
 * until all results are returned.
 * @param {String} url
 * @param {Object} options
 * @return {Promise}
 */
export default function fetchAll( url, options ) {
   return fetch( url, options )
      .then( function handleResponse( response ) {
         const promise = response.json();
         const links = response.headers.get( 'Link' );
         const next = links && parseLinks( links ).next;

         if( next ) {
            return fetch( next, options )
               .then( handleResponse )
               .then( ( tail ) => promise.then( ( head ) => head.concat( tail ) ) );
         } else {
            return promise;
         }
      } );
}
