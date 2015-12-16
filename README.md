# ax-github

> :octocat: Activites to provide GitHub data and events as resources

*Note:* This repo contains ECMAScript2015 code! To use these activities
with RequireJS, install `requirejs-babel` 0.0.8 and add the following
to your `require_config.js` file:

```js
   paths: {
      es6: 'requirejs-babel/es6',
      babel: 'requirejs-babel/babel-5.8.22.min'
   },
   config: {
      es6: {
         sourceMap: 'inline',
         resolveModuleSource: function( source ) {
            return ( source[0] === '.' ) ? 'es6!' + source : source;
         }
      }
   }
```

Additionally the activities heavily use `window.fetch` and `window.Promise`
so if your browser does not support these, you'll have to use a shim.

```json
"activies": [

   {
      "widget": "amd:laxar-github/userdata-activity",
      "features": {
         "auth": {
            "resource": "accessToken",
            "flag": "authenticated"
         },
         "user": {
            "resource": "user"
         },
         "repos": {
            "resource": "repos",
            "sort": "updated",
            "direction": "desc"
         }
      }
   },
   {
      "widget": "amd:laxar-github/data-activity",
      "features": {
         "auth": {
            "resource": "accessToken",
            "flag": "authenticated"
         },
         "data": {
            "resource": "issues",
            "sources": {
               "resource": "resource",
               "follow": "issues_url"
            }
         }
      }
   },
   {
      "widget": "amd:laxar-github/events-activity",
      "features": {
         "auth": {
            "resource": "accessToken",
            "flag": "authenticated"
         },
         "events": {
            "resource": "events",
            "sources": {
               "resource": "repos",
               "follow": "events_url"
            }
         }
      }
   }

]
```
