# ax-github

> :octocat: Activites to provide GitHub data and events as resources


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
            "resource": "user",
            "sources": [
               "https://api.github.com/user"
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
            "resource": "repos",
            "sources": {
               "resource": "user",
               "follow": "repos_url"
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
