#!/bin/sh
kill `cat github-listener.pid`
nohup node app.js &
