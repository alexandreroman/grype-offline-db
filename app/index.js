/**
 * Copyright 2023 VMware Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const { get } = require('http')
const app = express()

require('log-timestamp')

const disableDbExpiration =
  ('true' === process.env.DISABLE_DB_EXPIRATION
  | 'True' === process.env.DISABLE_DB_EXPIRATION
  | 'yes'  === process.env.DISABLE_DB_EXPIRATION
  | '1'    === process.env.DISABLE_DB_EXPIRATION) || false

app.get('/', (req, res) => {
  const year = 2023
  const str = `Grype Offline Database.
Copyright (c) ${year} VMware Inc. All Rights Reserved.`
  res.type('txt')
  res.send(str)
})

app.get('/listing.json', (req, res) => {
  fs.readFile('grype-db.json', (err, data) => {
    if(err) throw err
    const dbJson = JSON.parse(data)

    var baseUrl;
    if(!process.env.BASE_URL || process.env.BASE_URL === '') {
      baseUrl = req.hostname
    } else {
      baseUrl = process.env.BASE_URL
    }
    if(!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'http://' + baseUrl
    }
    const url = new URL('grype-db.tar.gz', baseUrl).toString()
    dbJson.url = url;

    if(disableDbExpiration) {
      dbJson.built = new Date().toISOString()
    }

    console.info(`Generating Grype offline database listing: url=${dbJson.url}, built=${dbJson.built}`)

    const listingJson = {}
    listingJson.available = {}
    listingJson.available[5] = []
    listingJson.available[5].push(dbJson)

    const listingStr = JSON.stringify(listingJson, 0, 2)
    res.type('json')
    res.send(listingStr)
  })
})

app.get('/grype-db.tar.gz', (req, res) => {
  res.sendFile('grype-db.tar.gz', {
    root: path.join(__dirname),
    acceptRanges: false
  })
})

const port = process.env.PORT | 8080;
app.listen(port, () => {
  console.info(`Server listening on port ${port}`)
})
