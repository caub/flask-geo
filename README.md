myMap_python
============

small webapp for searching geographic-content, forked from https://github.com/mitsuhiko/flask/tree/master/examples/flaskr


  - What is it using?

  It's a [flask](http://flask.pocoo.org/) based application  
  the ORM is using sqlite right now, but other possible (NoSQL) databases are being added  
  the current SQL queries don't rely on SQL specificities, it uses [geocell lib](http://code.google.com/p/geomodel/source/browse/trunk/geo/geomodel.py?r=20) (see utils/geocell) for 2D map queries, and a combinatorial (see utils/__init__) function for categories queries

  - How do I use it?

  1. open a python shell and run this:

  `>>> from myMap import create_db; create_db()`

  2. now you can run `python myMap.py`
     the application will greet you on http://localhost:5000/
  
  - Is it tested?

  Run `myMap_tests.py` file to see the tests pass.
  