/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import parseLinks from './parse-links';

/**
 * Wrapper around Request constructor to allow `.apply`.
 * This is partly a workaround for a bug in the fetch polyfill where the Request
 * constructor does not accept another Request object as input.
 * @param {String|Request} input
 * @param {RequestInit} [init]
 * @return {Request}
 */
function createRequest( input, init ) {
   if( Request.prototype.isPrototypeOf( input ) ) {
      return input;
   } else {
      return new Request( input, init );
   }
}

/**
 * Fetch the given URL and keep following the "next" link
 * until all results are returned.
 * @param {String|Request} input
 * @param {RequestInit} [init]
 * @return {Promise}
 */
export default function fetchAll() {
   const request = createRequest.apply( null, arguments );
   const options = {
      method: request.method,
      headers: request.headers
   };

   return fetch( request ).then( function handleResponse( response ) {
      const links = response.headers.get( 'Link' );
      const next = links && parseLinks( links ).next;
      const promise = response.json();

      if( next ) {
         return fetch( next, options )
            .then( handleResponse )
            .then( ( tail ) => promise.then( ( head ) => head.concat( tail ) ) );
      } else {
         return promise;
      }
   } );
}

