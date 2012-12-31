myMap_python
============

small webapp for searching geographic-content, forked from https://github.com/mitsuhiko/flask/tree/master/examples/flaskr


What is it using?
----

  It's a [flask](http://flask.pocoo.org/) based application  
  the ORM is using sqlite right now, but other possible (NoSQL) databases are being added  
  the current SQL queries don't rely on SQL specificities, it uses [geocell lib](http://code.google.com/p/geomodel/source/browse/trunk/geo/geomodel.py?r=20) (see utils/geocell) for 2D map queries, and a combinatorial (see utils/__init__) function for categories queries

How do I use it?
---

  - open a python shell and run this:

  `>>> from myMap import create_db; create_db()`

  - now you can run `python myMap.py`
     the application will greet you on [http://localhost:5000](http://localhost:5000/)
  
Is it tested?
---

  Run `myMap_tests.py` file to see the tests pass.
  

[Deploy](http://flask.pocoo.org/docs/deploying/mod_wsgi/#creating-a-wsgi-file) it
----

  Simplest way to run it as a wsgi application is with Apache: just install mod_wsgi, and add in your VirtualHost config:

```
    WSGIDaemonProcess myMap user=cab group=cab threads=5
    WSGIScriptAlias /geo /home/cab/git/myMap/myMap.wsgi

    <Directory /home/cab/git/myMap>
      WSGIProcessGroup myMap
      WSGIApplicationGroup %{GLOBAL}
      Order deny,allow
      Allow from all
    </Directory>
```

  - edit:

a nodejs server is used for websockets  
requires to install nodejs, npm, and install node's package socket.io  
make apache run on a different port than 80, adjust the routing in node-ws.js  
and run `sudo node node-ws.js` 
