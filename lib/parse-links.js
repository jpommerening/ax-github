define(['exports', 'module'], function (exports, module) {
   /**
    * Copyright 2015 aixigo AG
    * Released under the MIT license.
    * http://laxarjs.org/license
    */

   'use strict';

   module.exports = parseLinks;
   var LINK_PATTERN = /^\s*<([^>]+)>;\s*rel="(\w+)"\s*$/;

   /**
    * Parse the value of an HTTP "Link" header.
    * @param {String} header the value of the header field.
    * @return {Object} an object mapping the rel="" values to link URLs
    */

   function parseLinks(header) {
      if (!header) {
         return {};
      }

      return header.split(',').map(function (link) {
         return LINK_PATTERN.exec(link);
      }).reduce(function (object, match) {
         if (match) {
            object[match[2]] = match[1];
         }
         return object;
      }, {});
   }
});
//# sourceMappingURL=parse-links.js.map
