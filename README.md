# node-pokemon-go-map-server

TODO

## Description

TODO

## Installation

First install the npm dependencies:

```
npm install
```

Then make the config file, you can copy 'config-default.json' to 'config.json' and change the depending values.
You can remove the fields where you didn't change the value.
For the accounts, here is an example:

```
{
    "username": "TODO",
    "password": "TODO",
    "provider": "TODO:ptc/google"
}

```

This file is stored under `./server/config/config.json`.

## HTTPS Certificates

```
$ openssl genrsa -out https-key.pem 1024 
$ openssl req -new -key https-key.pem -out certrequest.csr
... bunch of prompts
$ openssl x509 -req -in certrequest.csr -signkey https-key.pem -out https-cert.pem
```