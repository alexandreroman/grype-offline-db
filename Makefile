#
# Copyright 2023 VMware Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#

APP_IMAGE := "ghcr.io/alexandreroman/grype-offline-db"
BUNDLE_IMAGE := "ghcr.io/alexandreroman/grype-offline-db-bundle"
GRYPE_DB_URL := "https://toolbox-data.anchore.io/grype/databases/listing.json"

all: install

_init:
	mkdir -p out/app
	cp app/*.js app/*.json out/app

local-build: out/app/db.json out/app/grype-db.tar.gz

out/app/db.json: _init
	curl -s $(GRYPE_DB_URL) | jq -r '.available."5" | first' > out/app/grype-db.json

out/app/grype-db.tar.gz: _init
	$(shell curl -s -o out/app/grype-db.tar.gz `jq -r -c '.url' < out/app/grype-db.json`)

local-run: _init
	cd out/app && npm i  && npm start

build: local-build
	pack build $(APP_IMAGE) -p out/app -B paketobuildpacks/builder:base

install: build
	docker push $(APP_IMAGE)
	mkdir -p out/bundle
	cp k8s/*.yaml out/bundle
	mkdir -p out/bundle/.imgpkg
	kbld -f out/bundle --imgpkg-lock-output out/bundle/.imgpkg/images.yml
	imgpkg push --bundle $(BUNDLE_IMAGE) --file out/bundle

run:
	docker run --rm -p 8080:8080 -e DISABLE_DB_EXPIRATION=true -e BASE_URL=http://localhost:8080 $(APP_IMAGE)

clean:
	rm -rf out
