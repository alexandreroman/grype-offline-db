
# Using Grype in offline environments

Using this project, you can use [Grype](https://github.com/anchore/grype)
in offline and airgapped environments.

Usually you need to [host your own Grype database](https://github.com/anchore/grype/blob/main/README.md#offline-and-air-gapped-environments)
in such environments.
This simple app simplifies this process, providing a way to host your
Grype database in your Kubernetes environment.

## Prerequisites

Here are some prerequisites to use this app:

- [imgpkg](https://carvel.dev/imgpkg/): for copying images to your private registry
- [kapp-controller](https://carvel.dev/kapp-controller/): for deploying the app from your private registry and dealing with image relocation
- [secretgen-controller](https://github.com/carvel-dev/secretgen-controller): for providing registry credentials
- [Knative](https://knative.dev/): for managing the app deployment

## How to use it?

Copy this app to your private registry:

```shell
imgpkg copy --bundle ghcr.io/alexandreroman/grype-offline-db-bundle --to-repo myreg.corp.com/grype-offline/grype-offline-db-bundle
```

This bundle contains container images and Kubernetes deployment files
you need to run this app.

Download the [app deployment file](kapp/app.yaml) to your workstation,
and edit this file accordingly by using your private registry:

```yaml
- imgpkgBundle:
    image: myreg.corp.com/grype-offline/grype-offline-db-bundle:latest
```

Create a Kubernetes `Secret` holding your registry credentials:

```shell
kubectl create secret docker-registry grype-offline-regcreds --docker-server=myreg.corp.com --docker-username=johndoe --docker-password=changeme
```

You are now ready to deploy the app:

```shell
kubectl apply -f app.yaml
```

The app will be deployed to the namespace `grype-offline`.

Use this command to get access to the Grype database URL:

```shell
kubectl -n grype-offline get ksvc db
```

```shell
NAME   URL                                           LATESTCREATED   LATESTREADY   READY   REASON
db     http://db.grype-offline.kn.127.0.0.1.nip.io   db-00001        db-00001      True
```

Using this URL, you can now configure Grype to use this offline database
(don't forget to add the suffix `/listing.json`):

```shell
GRYPE_DB_UPDATE_URL=http://db.grype-offline.kn.127.0.0.1.nip.io/listing.json grype db list
```

```shell
Built:    2023-05-22 13:35:24.568 +0000 UTC
URL:      http://db.grype-offline.kn.127.0.0.1.nip.io/grype-db.tar.gz
Checksum: sha256:19e63537c4605aeab03db75b35b8745a76c2486f9747aa35b6da1952724198b3

1 databases available for schema 5
```

Hope it helps!

## Contribute

Contributions are always welcome!

Feel free to open issues & send PR.

## License

Copyright &copy; 2023 [VMware, Inc. or its affiliates](https://vmware.com).

This project is licensed under the [Apache Software License version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
