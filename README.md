# node-pokemon-go-map-server

TODO

## Description

TODO

## Installation

First install the npm dependencies:

```
npm install
```

Then make the config file, here is an example:

```
{
    "username": "TODO",
    "password": "TODO",
    "provider": "TODO:ptc/google",
    "location": {
        "name": "TODO"
        "coords": {
            "latitude": TODO,
            "longitude": TODO,
            "altitude": TODO
        },
        "type": "TODO: name/coords",
    },
    "steps": TODO,
    "maps": {
        "apikey": "TODO"
    }
}

```

This file is stored under `TODO`.

## HTTPS Certificates

```
$ openssl genrsa -out https-key.pem 1024 
$ openssl req -new -key https-key.pem -out certrequest.csr
... bunch of prompts
$ openssl x509 -req -in certrequest.csr -signkey https-key.pem -out https-cert.pem
```