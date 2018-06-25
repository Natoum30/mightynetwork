### What's this ?
Simple app test implementing ActivityPub in NodeJS

### Dependencies

npm : NodeJS package manager

MongoDB

### Installation guide

In the cloned folder run :

npm install

Create your Mongo database

### How to launch the app

mongod --dbpath $DBPATH -setParameter failIndexKeyTooLong=false
H

The "setParameter" is used because sometimes the private key seems to be too long to be stored by mongo, I cannot figure out why yet but it will be fixed !

env NODE_PORT=8000 INSTANCE='mightynetwork' nodemon
