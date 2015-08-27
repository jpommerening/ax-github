define(['exports', 'laxar-patterns', '../lib/handle-auth', '../lib/wait-for-event', '../lib/extract-pointers', '../lib/throttled-publisher', '../lib/fetch-all'], function (exports, _laxarPatterns, _libHandleAuth, _libWaitForEvent, _libExtractPointers, _libThrottledPublisher, _libFetchAll) {
   /**
    * Copyright 2015 aixigo AG
    * Released under the MIT license.
    * http://laxarjs.org
    */

   'use strict';

   Object.defineProperty(exports, '__esModule', {
      value: true
   });

   function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

   function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

   var _patterns = _interopRequireDefault(_laxarPatterns);

   var _handleAuth = _interopRequireDefault(_libHandleAuth);

   var _waitForEvent = _interopRequireDefault(_libWaitForEvent);

   var _extractPointers = _interopRequireDefault(_libExtractPointers);

   var _throttledPublisherForFeature = _interopRequireDefault(_libThrottledPublisher);

   var _fetchAll = _interopRequireDefault(_libFetchAll);

   var OUTCOME_ERROR = _patterns['default'].actions.OUTCOME_ERROR;
   var OUTCOME_SUCCESS = _patterns['default'].actions.OUTCOME_SUCCESS;

   var name = 'github-data-activity';
   exports.name = name;
   var injections = ['axEventBus', 'axFeatures'];
   exports.injections = injections;
   var create = function create(eventBus, features) {
      return new Controller(eventBus, features);
   };

   exports.create = create;
   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   var Controller = function Controller(eventBus, features) {
      _classCallCheck(this, Controller);

      this.eventBus = eventBus;
      this.features = features;

      var baseOptions = {
         method: 'GET',
         headers: {}
      };

      var ready = (0, _handleAuth['default'])(eventBus, features, 'auth').then(setAuthHeader).then((0, _waitForEvent['default'])(eventBus, 'beginLifecycleRequest'));

      var dataPublisher = (0, _throttledPublisherForFeature['default'])(this, 'data');

      if (features.data.sources.resource) {
         _patterns['default'].resources.handlerFor(this).registerResourceFromFeature('data.sources', {
            onReplace: function onReplace(event) {
               Promise.all(provideResources(event.data)).then(dataPublisher.replace);
            },
            onUpdate: function onUpdate(event) {
               var patches = event.patches.map(mapPatchValue.bind(null, provideResource));
               Promise.all(patches.map(wrapPatchInPromise)).then(dataPublisher.update);
            }
         });
      } else if (features.data.sources.length) {
         Promise.all(provideResources(features.data.sources)).then(dataPublisher.replace);
      }

      var provideActions = features.data.onActions || [];
      var provideHandler = createRequestHandler(eventBus, provideResource);

      provideActions.forEach(function (action) {
         eventBus.subscribe('takeActionRequest.' + action, provideHandler);
      });

      eventBus.subscribe('beginLifecycleRequest', function () {});

      eventBus.subscribe('endLifecycleRequest', function () {});

      function setAuthHeader(data) {
         if (data && data.access_token) {
            baseOptions.headers['Authorization'] = 'token ' + data.access_token;
         } else {
            delete baseOptions.headers['Authorization'];
         }
      }

      function provideResources(sources) {
         return sources.map(provideResource);
      }

      function provideResource(source) {
         var options = Object.create(baseOptions);
         var follow = source.follow || features.data.sources.follow;

         return ready.then(function () {
            return (0, _extractPointers['default'])(source, follow, function (url) {
               return (0, _fetchAll['default'])(url, options);
            });
         });
      }
   }

   /////////////////////////////////////////////////////////////////////////////////////////////////////////////

   ;

   function mapPatchValue(callback, patch) {
      var result = {
         op: patch.op,
         path: patch.path
      };
      if (patch.from) {
         result.from = patch.from;
      }
      if (patch.value) {
         result.value = callback(patch.value);
      }
      return result;
   }

   /////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function wrapPatchInPromise(patch) {
      if (patch.value) {
         return patch.value.then(function (value) {
            return mapPatchValue(function () {
               return value;
            }, patch);
         });
      } else {
         return Promise.resolve(patch);
      }
   }

   /////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createRequestHandler(eventBus, provider) {

      return function (event) {
         var action = event.action;
         var data = event.data;
         var resource = data.resource;
         var topic = action + '-' + resource;

         return eventBus.publish('willTakeAction.' + topic, {
            action: action,
            data: data
         }).then(function () {
            return provider(data);
         }).then(function (data) {
            return eventBus.publish('didReplace.' + resource, {
               resource: resource,
               data: data
            });
         }).then(function () {
            return OUTCOME_SUCCESS;
         }, function (error) {
            console.log(error);
            return OUTCOME_ERROR;
         }).then(function (outcome) {
            return eventBus.publish('didTakeAction.' + topic + '.' + outcome, {
               action: action,
               outcome: outcome,
               data: data
            });
         });
      };
   }
});
//# sourceMappingURL=github-data-activity.js.map
