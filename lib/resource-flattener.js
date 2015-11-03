/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

/**
 * Flattens a resource of nested arrays and transforms
 * updates and replacements so that the resulting resource
 * appears to be a continuous array.
 *
 * No need to keep a copy of the resource data, just a
 * sparse mapping array.
 *
 * @return {Object}
 */
export default function resourceFlattener() {
   const flat = [];

   /**
    * Flattens the given data and updates the internal mapping
    * for future updates.
    *
    * @param {Array[]} data
    * @return {Array} data
    */
   function replace( data ) {
      let result = [];

      flat.slice();

      for( let i = 0; i < data.length; i++ ) {
         result.push.apply( result, data[ i ] );
         flat.push( result.length );
      }
      console.log( 'replace', result, flat );
      return result;
   }

   /**
    * @param {Object[]} patches
    * @return {Object[]} patches
    */
   function update( patches ) {
      let result = [];
      let i, j;

      function op( options ) {
         return result.push( options );
      }

      function add( path, value ) {
         return op( { op: 'add', path, value } );
      }

      function remove( path ) {
         return op( { op: 'remove', path } );
      }

      function replace( path, value ) {
         return op( { op: 'replace', path, value } );
      }


      for( i = 0; i < patches.length; i++ ) {
         let patch = patches[ i ];
         let match = /^\/(\d+|\-)(\/([^/]+)(\/.+)?)?/.exec( patch.path );
         let offset = match[ 3 ];
         let path = match[ 4 ];

         let index = ( match[ 1 ] === '-' ) ? flat.length : match[ 1 ];
         let start = ( index > 0 ) ? flat[ index - 1 ] : 0;
         let length = 0;

         if( index < flat.length ) {
            length = flat[ index ] - start;
         } else if( patch.value ) {
            length = patch.value.length;
         }

         if( offset ) {
            index += offset;
         }

         if( path ) {
            patch.path = '/' + index + path;
            op( patch );
            continue;
         }

         switch( patch.op ) {
            case 'add':
               for( j = 0; j < length; j++ ) {
                  add( '/' + ( index + j ), path.value[ j ] );
               }
               break;
            case 'remove':
               for( j = 0; j < length; j++ ) {
                  remove( '/' + ( index + j ) );
               }
               length = -length;
               break;
            case 'replace':
               for( j = 0; j < patch.value.length && j < end - start; j++ ) {
                  replace( '/' + ( index + j ), patch.value[ j ] );
               }
               length = 0;
               for( ; j < patch.value.length; j++ ) {
                  add( '/' + ( index + j ), path.value[ j ] );
                  length++;
               }
               for( ; j < end - start; j++ ) {
                  remove( '/' + ( index + j ) );
                  length--;
               }
               break;
         }
         for( j = index; j < flat.length; j++ ) {
            flat[ j ] += length;
         }
      }
      console.log( 'update', result, flat );
      return result;
   }

   function wrap( publisher ) {
      return {
         replace: function( data ) {
            return publisher.replace( replace( data ) );
         },
         update: function( patches ) {
            return publisher.update( update( data ) );
         }
      };
   }

   return {
      replace: replace,
      update: update,
      wrap: wrap
   };
}


