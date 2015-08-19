/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( function() {

   return function parseLinks( string ) {
      var pattern = /^\s*<([^>]+)>;\s*rel="(\w+)"\s*$/;

      if( !string ) {
         return {};
      }

      return string
         .split( ',' )
         .map( pattern.exec.bind( pattern ) )
         .reduce( function( object, match ) {
            if( match ) {
               object[ match[ 2 ] ] = match[ 1 ];
            }
            return object;
         }, {} );
   }

} );
