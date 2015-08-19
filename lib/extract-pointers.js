/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar-patterns',
   './to-json-pointer'
], function( patterns, toJsonPointer ) {

   function mapPromise( object, callback ) {
      var result = {};
      if( object instanceof Array ) {
         return Promise.all( object.map( callback ) );
      } else if( typeof object === 'object' ) {
         return Promise.all( Object.keys( object ).map( function( key ) {
            return callback( object[ key ] ).then( function( value ) {
               result[ key ] = value;
            } );
         } ) ).then( function() {
            return result;
         } );
      }
   }

   function populateObject( object, callback ) {

      function populate( object ) {
         try {
            var result = mapPromise( object, populate ) || callback( object );
         }
         catch( error ) {
            console.log( error );
            return Promise.reject( error );
         }

         return ( typeof result.then === 'function' ) ? result : Promise.resolve( result );
      };

      return populate( object );
   };


   function extractPointers( object, pointers, callback ) {
      return populateObject( pointers, function( pointer ) {
         var value = patterns.json.getPointer( object, toJsonPointer( pointer ) );
         return callback( value, pointer );
      } );
   };

   return extractPointers;

} );
