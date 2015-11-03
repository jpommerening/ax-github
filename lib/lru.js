/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

export default function LRU( size, init ) {
   const items = init || Object.create( null );
   const keys = Object.keys( items );

   function pop( key ) {
      const value = items[ key ];
      const index = keys.indexOf( key );

      delete items[ key ];

      if( index >= 0 ) {
         keys.splice( index, 1 );
      }
      return value;
   }

   function push( key, value ) {
      keys.push( key );
      items[ key ] = value;

      if( keys.length > size ) {
         delete items[ keys.shift() ];
      }
   }

   function use( key ) {
      const index = keys.indexOf( key );

      if( index >= 0 ) {
         keys.splice( index, 1 );
         keys.push( index );
      }
   }

   return {
      has: function has( key ) {
         return key in items;
      },
      get: function get( key ) {
         use( key );
         return items[ key ];
      },
      set: function set( key, value ) {
         pop( key );
         push( key, value );
         return value;
      },
      push: push,
      pop: pop,
      clear: function clear() {
         keys.forEach( pop );
      },
      items: items
   };

};
