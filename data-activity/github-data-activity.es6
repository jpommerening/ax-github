/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

import patterns from 'laxar-patterns';
import handleAuth from '../lib/handle-auth';
import waitForEvent from '../lib/wait-for-event';
import extractPointers from '../lib/extract-pointers';
import throttledPublisherForFeature from '../lib/throttled-publisher';
import fetchAll from '../lib/fetch-all';

const OUTCOME_ERROR = patterns.actions.OUTCOME_ERROR;
const OUTCOME_SUCCESS = patterns.actions.OUTCOME_SUCCESS;

export const name = 'github-data-activity';
export const injections = [ 'axEventBus', 'axFeatures' ];
export const create = ( eventBus, features ) => new Controller( eventBus, features );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Controller {
   constructor( eventBus, features ) {
      this.eventBus = eventBus;
      this.features = features;

      var baseOptions = {
         method: 'GET',
         headers: {}
      };

      const ready = handleAuth( eventBus, features, 'auth' )
                       .then( setAuthHeader )
                       .then( waitForEvent( eventBus, 'beginLifecycleRequest' ) );

      var dataPublisher = throttledPublisherForFeature( this, 'data' );

      if( features.data.sources.resource ) {
         patterns.resources.handlerFor( this )
            .registerResourceFromFeature( 'data.sources', {
               onReplace: function( event ) {
                  Promise.all( provideResources( event.data ) ).then( dataPublisher.replace );
               },
               onUpdate: function( event ) {
                  var patches = event.patches.map( mapPatchValue.bind( null, provideResource ) );
                  Promise.all( patches.map( wrapPatchInPromise ) ).then( dataPublisher.update );
               }
            } );
      } else if( features.data.sources.length ) {
         Promise.all( provideResources( features.data.sources ) ).then( dataPublisher.replace );
      }

      var provideActions = features.data.onActions || [];
      var provideHandler = createRequestHandler( eventBus, provideResource );

      provideActions.forEach( function( action ) {
         eventBus.subscribe( 'takeActionRequest.' + action, provideHandler );
      } );

      eventBus.subscribe( 'beginLifecycleRequest', function() {
      } );

      eventBus.subscribe( 'endLifecycleRequest', function() {
      } );

      function setAuthHeader( data ) {
         if( data && data.access_token ) {
            baseOptions.headers[ 'Authorization' ] = 'token ' + data.access_token;
         } else {
            delete baseOptions.headers[ 'Authorization' ];
         }
      }

      function provideResources( sources ) {
         return sources.map( provideResource );
      }

      function provideResource( source ) {
         const options = Object.create( baseOptions );
         const follow = source.follow || features.data.sources.follow;

         return ready.then( () =>
            extractPointers( source, follow, ( url ) => fetchAll( url, options ) ) );
      }
   }

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function mapPatchValue( callback, patch ) {
   var result = {
      op: patch.op,
      path: patch.path
   };
   if( patch.from ) {
      result.from = patch.from;
   }
   if( patch.value ) {
      result.value = callback( patch.value );
   }
   return result;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function wrapPatchInPromise( patch ) {
   if( patch.value ) {
      return patch.value.then( ( value ) =>
         mapPatchValue( () => value, patch ) );
   } else {
      return Promise.resolve( patch );
   }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function createRequestHandler( eventBus, provider ) {

   return function( event ) {
      const action = event.action;
      const data = event.data;
      const resource = data.resource;
      const topic = action + '-' + resource;

      return eventBus.publish( 'willTakeAction.' + topic, {
         action: action,
         data: data
      } ).then( function() {
         return provider( data );
      } ).then( function( data ) {
         return eventBus.publish( 'didReplace.' + resource, {
            resource: resource,
            data: data
         } );
      } ).then( function() {
         return OUTCOME_SUCCESS;
      }, function( error ) {
         console.log( error );
         return OUTCOME_ERROR;
      } ).then( function( outcome ) {
         return eventBus.publish( 'didTakeAction.' + topic + '.' + outcome, {
            action: action,
            outcome: outcome,
            data: data
         } );
      } );
   };
}

