# ax-github

> Activites to provide GitHub data and events as resources


```json
"activies": [

   {
      "widget": "amd:laxar-github/data-activity",
      "features": {
         "auth": {
            "resource": "accessToken",
            "flag": "authenticated"
         },
         "data": {
            "resource": "repos",
            "sources": [
               "https://api.github.com/repos/LaxarJS/laxar",
               "https://api.github.com/repos/LaxarJS/laxar-patterns",
               "https://api.github.com/repos/LaxarJS/laxar-uikit"
            ]
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
            "resource": "tags",
            "sources": {
               "resource": "repos",
               "follow": "tags_url"
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
            "resource": "tags",
            "sources": {
               "resource": "repos",
               "follow": "events_url"
            }
         }
      }
   }

]
```
