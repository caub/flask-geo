# -*- coding: utf-8 -*-
"""
    Flaskr
    ~~~~~~

    A microblog example application written as Flask tutorial with
    Flask and sqlite3.

    :copyright: (c) 2010 by Armin Ronacher.
    :license: BSD, see LICENSE for more details.
"""
from __future__ import with_statement
from sqlite3 import dbapi2 as sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash, _app_ctx_stack

from utils import geocell, geotypes, combi
import json, uuid
#import sys
#sys.path.insert(0, '/home/cab/git/myMap')

# configuration
DATABASE = '/home/cab/git/myMap/flaskr.db'
DEBUG = True
SECRET_KEY = 'development key'
USERNAME = 'test_myapp@yopmail.com'
PASSWORD = '1'
EARTH = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

# create our little application :)
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar('FLASKR_SETTINGS', silent=True)


def create_db():
    """Creates the database tables."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql') as f:
            db.cursor().executescript(f.read())
        db.commit()

def init_db():
    """Creates the database tables."""
    with app.app_context():
        db = get_db()


def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    top = _app_ctx_stack.top
    if not hasattr(top, 'sqlite_db'):
        top.sqlite_db = sqlite3.connect(app.config['DATABASE'])
    return top.sqlite_db


@app.teardown_appcontext
def close_db_connection(exception):
    """Closes the database again at the end of the request."""
    top = _app_ctx_stack.top
    if hasattr(top, 'sqlite_db'):
        top.sqlite_db.close()


@app.route('/')
def show_map():
    if not session.get('logged_in'):
        return redirect(url_for('login'))

    #app.logger.debug('im there')
    # db = get_db()
    # cur = db.execute('select title, text from entries order by id desc')
    # entries = [dict(title=row[0], text=row[1]) for row in cur.fetchall()]
    return render_template('map.html')

@app.route('/search')
def show_points():


    if ('earth' in request.args):
        cells=EARTH
    else:
        (n,e,s,w)=(request.args.get('n'), request.args.get('e'), request.args.get('s'), request.args.get('w'))
        cells=geocell.best_bbox_search_cells(geotypes.Box(float(n),float(e),float(s), float(w)))
    
    tags = json.loads(request.args.get('tags'))

    predicates = ['cell_id=:%d AND tag_id=:tags'%i for i in range(1,len(cells))]
    predStr = ' OR '.join(predicates)
    names = dict(zip( map(str, range(1, len(cells)+1)), cells))
    names['tags'] = ''.join(tags)
    db = get_db()
    app.logger.debug(names)
    cur = db.execute('select id, author, text, lat, lng, time, tags from points JOIN pointscells USING(id) JOIN pointstags USING(id) WHERE %s'%predStr, names)
    entries = [dict(id=row[0],author=row[1],text=row[2],lat=row[3],lng=row[4],time=row[5],tags=row[6]) for row in cur.fetchall()]
    return json.dumps(entries)



@app.route('/add', methods=['POST'])
def add_entry():
    if not session.get('logged_in'):
        abort(401)

    app.logger.debug(request.form)
    id = str(uuid.uuid4())
    lat, lng = (request.form['lat'], request.form['lng'])
    lat = float(lat)
    lng = float(lng)
    tags = json.loads(request.form['tags'])
    combitags = combi(tags).result
    app.logger.debug(combitags)
    cell = geocell.compute(geotypes.Point(lat, lng), 14)
    cells = geocell.parents(cell)
    app.logger.debug(cells)
    db = get_db()
    db.execute('insert into points (id, author, text, lat, lng, time, tags) values (?, ?, ?, ?, ?, ?, ?)',
                 [id, "test_myapp@yopmail.com", request.form['text'], lat, lng, request.form['time'], request.form['tags']])
    for c in cells:
        db.execute('insert into pointscells (id, cell_id) values (?, ?)', [id, c])
    for t in combitags:
        db.execute('insert into pointstags (id, tag_id) values (?, ?)', [id, t])
    db.commit()
    flash('New entry was successfully posted')
    return redirect(url_for('show_map'))


@app.route('/delete')
def del_entry():
    if not session.get('logged_in'):
        abort(401)
    app.logger.debug(request.args.get('id'))
    db = get_db()
    db.execute('delete from points WHERE id=?', [request.args.get('id')])
    db.commit()
    return redirect(url_for('show_map'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != app.config['USERNAME']:
            error = 'Invalid username'
        elif request.form['password'] != app.config['PASSWORD']:
            error = 'Invalid password'
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('show_map'))
    return render_template('login.html', error=error)

    
@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        if request.form['username'] == "":
            error = 'login empty'
        elif request.form['password'] != request.form['confirm']:
            error = 'password confirm incorrect'
        else:
            flash('sorry register is not done yet, use this login')
            return redirect(url_for('show_map'))
    return render_template('login.html', error=error, register=True)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('show_map'))


if __name__ == '__main__':
    init_db()
    app.debug = True
    app.run(host='0.0.0.0')
