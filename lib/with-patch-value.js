/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

/**
 * Transform the value of a patch by passing it to
 * a callback and return a promise resolving to
 * the resulting patch.
 * The callback should return a promise. When that
 * is resolved (with the new value) the promise representing
 * the updated patch is resolved.
 * @param {Function} callback
 * @return {Promise} a promise representing the updated patch.
 */
export default function withPatchValue( callback ) {
   return function( patch ) {
      const result = {
         op: patch.op,
         path: patch.path
      };
      if( patch.from ) {
         result.from = patch.from;
      }
      if( patch.value ) {
         return callback( patch.value ).then( function( value ) {
            result.value = value;
            return result;
         } );
      } else {
         return Promise.resolve( result );
      }
   };
}


