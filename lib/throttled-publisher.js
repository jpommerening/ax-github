/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import patterns from 'laxar-patterns';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const nullPublisher = {};
nullPublisher.replace = nullPublisher.update = nullPublisher.update = () => null;

export default function throttledPublisherForFeature( context, feature, options ) {
   if( !(context.features[ feature ] && context.features[ feature ].resource) ) {
      return nullPublisher;
   }

   const replace = throttleReplacements( patterns.resources.replacePublisherForFeature( context, feature ), options );
   const update = throttleUpdates( patterns.resources.updatePublisherForFeature( context, feature ), options );

   return {
      replace: function( data ) {
         update.flush();
         return replace( data );
      },
      update: function( patches ) {
         replace.flush();
         return update( patches );
      },
      flush: function() {
         replace.flush();
         update.flush();
      },
      push: ( item ) => update( [ { op: 'add', path: '/-', value: item } ] )
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function throttleReplacements( publisher, options ) {
   const maxLatency = (options || {}).maxLatency || 150;
   var timeout;
   var buffer;

   function replace() {
      const data = buffer;
      if( buffer ) {
         publisher( buffer );
         timeout = setTimeout( function() {
            if( buffer !== data ) {
               publisher( buffer );
            }
            buffer = null;
         }, maxLatency );
      }
   }

   function handleReplacements( data ) {
      const first = !buffer;

      buffer = data;

      if( first ) {
         replace();
      }
   }

   handleReplacements.flush = replace;

   return handleReplacements;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function throttleUpdates( publisher, options ) {
   const maxBatchSize = (options || {}).maxBatchSize || 20;
   const maxLatency = (options || {}).maxLatency || 150;
   var timeout;
   var batch = [];

   function update() {
      if( batch.length ) {
         publisher( batch );
         batch = [];
      }
      if( timeout ) {
         clearTimeout( timeout );
         timeout = null;
      }
   }

   function handleUpdates( patches ) {
      batch.push.apply( batch, patches );

      if( batch.length >= maxBatchSize ) {
         update();
      } else if( !timeout ) {
         timeout = setTimeout( update, maxLatency );
      }
   }

   handleUpdates.flush = update;

   return handleUpdates;
}
