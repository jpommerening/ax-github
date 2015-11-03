/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org
 */
import URI from 'URIjs/src/URI';
import URITemplate from 'URIjs/src/URITemplate';

/**
 * Similar to regular URITemplate expansion, but appends all
 * unexpected expansions as query parameters.
 *
 * For example, given the template `"https://example.com{/foo}"`
 * and the object `{ foo: '/bar', baz: '123' }` you'd get
 * the URL `"https://example.com/bar?baz=123"`.
 * Note that if the URL is not a template (has no variables)
 * this is the same as just appending the object as query
 * parameters.
 *
 * Why is this useful? GitHubs REST responses don't list every
 * possible query parameter and this function provides an easy
 * way to substitute both variables and query parameters in
 * one pass.
 *
 * @param {String} url the URL (template) to expand.
 * @param {Object} expansion the expansion parameters.
 * @return {URI} the expanded URL
 */
export default function expandUrl( url, expansion ) {
   const template = URITemplate( url ).parse();

   const variables = template.parts
      .map( ( { variables } ) => variables )
      .filter( vars => vars && vars instanceof Array )
      .reduce( ( vars, other ) => vars.concat( other ), [] )
      .map( ( { name } ) => name );

   const parameters = Object.keys( expansion )
      .filter( name => variables.indexOf( name ) < 0 )
      .reduce( ( parameters, name ) => {
         parameters[ name ] = expansion[ name ];
         return parameters;
      }, {} );

   return URI( template.expand( expansion ) ).query( parameters );
}

