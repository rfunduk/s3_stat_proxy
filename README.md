## S3 Stat Proxy

This is a really simple Node app which simply takes any
request to `/file/*` and redirects to the same file in an
S3 bucket (configured at the top of `app.js`).

Before it redirects it counts the request in a simple
file-system based database.

Access the counts by `/admin`, configure the HTTP basic
auth password at the top of `app.js`.

---

## Running this thing:

Best bet is to probably just add a vhost/equivalent,
say `s3.yourdomain.com` and wire up the node app
as a [proxy](http://httpd.apache.org/docs/2.0/mod/mod_proxy.html).

The app runs on port 3000 by default, but you'll
find it configurable (seeing a trend here?) at the
top of `app.js`.

After that just change all your S3 urls from stuff like:

    http://somebucket.s3.amazonaws.com/some/folder/image.png

To:

    http://s3.yourdomain.com/file/some/folder/image.png

And visit:

    http://s3.yourdomain.com/admin

To see the counts.
