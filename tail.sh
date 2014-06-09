#!/bin/sh
tail -f ./logs/application.log | ./node_modules/.bin/bunyan -l debug
