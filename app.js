#!/usr/bin/env node

var BUCKET = 's3sp';
var PASSWORD = 'CHANGEME';
var PORT = process.env.PORT || 3000;

var _ = require('underscore')._;

var knox = require('knox').createClient( {
  key: 'x', secret: 'x', // not needed for redirecting to public urls
  bucket: BUCKET
} );

var finder = require('findit');
var db = new (require('./lib/fsdocs').FSDocs)( __dirname + '/db' );

var connect = require('connect');
var app = require('express').createServer();

var HELPERS = {
  formatDateTime: function( date ) {
    if( typeof( date ) == 'string' ) {
      date = new Date( date );
    }

    // date
    var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                   'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
    var dateString = [
      months[date.getMonth()],
      date.getDate(),
      date.getFullYear()
    ].join(' ');

    // time
    var minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes.toString() : minutes.toString();
    var timeString = date.getHours() + ':' +  minutes;
    return dateString + ' @ ' + timeString;
  }
}

app.get( '/admin', connect.basicAuth( 'admin', PASSWORD ), function( req, res ) {
  var keys = [];
  var results = [];
  var stack = 1;
  function done() {
    if( stack > 0 ) { return; }
    res.contentType('text/html');
    res.render( 'index.jade', {
      layout: 'layout',
      h: HELPERS,
      total: keys.length,
      results: results
    } );
  }

  var walker = finder.find( __dirname + '/db' );
  walker.on( 'file', function( file ) {
    if( file.match( /current\.json$/ ) != null ) {
      file = file.replace( __dirname + '/db/', '' ).replace( '/current.json', '' );
      stack++;
      keys.push( file );
      var doc = db.get( file, function( err, doc ) {
        doc.file = file;
        results.push( doc );
        stack--; done();
      } );
    }
  } );
  walker.on( 'end', function() {
    stack--; done();
  } );
} );

app.get( '/file/*', function( req, res ) {
  var file = req.params.join('');
  function incCount() {
    db.get( file, function( err, doc ) {
      if( err ) {
        // something went horribly wrong...? bail
        return;
      }
      if( doc == null ) {
        // doc is new
        doc = { count: 0 };
      }
      doc.count++;
      doc.lastAccess = new Date();
      db.put( file, doc, function( err, ok ) {
        if( !ok ) {
          incCount(); // try again
        }
        else {
          //console.log( 'wrote doc for ' + file + ' -- ' + doc.count );
        }
      } );
    } );
  }
  incCount();
  res.redirect( knox.url( file ) );
} );

app.listen( PORT );
console.log( '...started on port ' + PORT );
