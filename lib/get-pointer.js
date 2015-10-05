/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */

import { json } from 'laxar-patterns';

export default function getPointer( object, pointer, fallback ) {
   if( pointer === '/' ) {
      return object === undefined ? fallback : object;
   } else {
      return json.getPointer( object, pointer, fallback );
   }
}
