

# **Airbnb-Planner**

Have you ever wanted to do travel some where but planning was a huge hassle. Well the first part to planning is to find accomadation and tickets which determines when you go. 

So this simple node app will help you find the cheapest airbnb accomadation for the certain period of time when you are available.

 Say you want to go on a trip somewhere along the lines of next year January and February for 10 days, then this will help you get the cheapest 10 days of airbnb accomadation within that time frame. If prices are too expensive at the capital city, the app also includes a find close by cities using geobyte's API.

I've currently only included simple parameters for airbnb search, no airbnb filters have been added in the requests (rooms, necessities, etc)

To use:

    npm i
    npm run airbnb

API's used:

 - Airbnb
 - Geobytes

Node modules used:

 - [axios](https://www.npmjs.com/package/axios) (http requests)
 - [retry-axios](https://www.npmjs.com/package/retry-axios) (re-attempt when blocked by API)
 - [readline](https://www.npmjs.com/package/readline) (writing to files)
 - [nodemon](https://www.npmjs.com/package/nodemon) (restart on save, used for easier development)

