/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   require( 'load-grunt-tasks' )( grunt );

   grunt.initConfig( {
      babel: {
         options: {
            sourceMap: true,
            modules: 'amd'
         },
         'default': {
            files: [
               {
                  expand: true,
                  src: [ '**/*.es6' ],
                  ext: '.js'
               }
            ]
         }
      },
      eslint: {
         'default': [ '**/*.es6' ]
      },
      watch: {
         'default': {
            files: [ '**/*.es6' ],
            tasks: [ 'eslint', 'babel' ]
         }
      }
   } );

   grunt.registerTask( 'default', [ 'eslint', 'babel' ] );
};
