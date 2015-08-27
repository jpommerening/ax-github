/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

/**
 * Wait for authentication and resolve the returned promise once the user
 * is authenticated.
 */
export default function handleAuth( eventBus, features, name ) {
   const feature = features[ name ];
   const resource = feature.resource;
   const flag = feature.flag;

   return new Promise( function( resolve, reject ) {
      var data = {};
      var state = !flag;

      if( !resource && !flag ) {
         return resolve( data );
      }

      if( resource ) {
         eventBus.subscribe( 'didReplace.' + resource, function( event ) {
            data = event.data;
            if( state ) {
               resolve( data );
            }
         } );
      }

      if( flag ) {
         eventBus.subscribe( 'didChangeFlag.' + flag, function( event ) {
            state = event.state;
            if( !state ) {
               reject( data );
            } else if( data ) {
               resolve( data );
            }
         } );
      }
   } );
}
