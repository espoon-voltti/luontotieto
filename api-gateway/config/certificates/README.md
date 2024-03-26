# Trusted SAML IdP certificates

Espoo AD (production):

- `espooad-internal-prod.2022.pem`

Espoo AD (staging):

- `espooad-internal-staging.2022.pem`

Voltti IDP (dev/test):

- `idp.test.espoon-voltti.fi.pem`

## Update list of trusted IdP certificates

1. Obtain URL for IdP metadata from the provider, for example:
    - Espoo AD production: <https://login.microsoftonline.com/6bb04228-cfa5-4213-9f39-172454d82584/federationmetadata/2007-06/federationmetadata.xml?appid=7d857df7-95fd-42f1-96e6-296c1094be09>
    - Espoo AD staging: <https://login.microsoftonline.com/6bb04228-cfa5-4213-9f39-172454d82584/federationmetadata/2007-06/federationmetadata.xml?appid=b73067a1-1f4c-4508-94ea-51c8eeb15793>
2. [Fetch](#fetch-saml-signing-certificates-from-metadata) certificate(s) from IdP's remote metadata
3. Update [code](https://github.com/espoon-voltti/luontotieto/blob/master/api-gateway/src/certificates.ts) to include any new files
4. Update apigw deployment configuration to include the name of the new certificate file(s)

## Fetch SAML signing certificates from metadata

Requirements:

- Python 3.8 (recommended to use [pyenv](https://github.com/pyenv/pyenv))
- [pipenv](https://pipenv.pypa.io/en/latest/install/)

SAML 2.0 metadata (XML) can contain multiple entities (usually different environments) and those entities can contain
multiple signing certificates.

To fetch all signing certificate for an IdP's entity use the helper script in this directory:

```sh
# Install python dependencies
pipenv install
# Fetch and export the certificates from a IdP metadata URL:
pipenv run ./fetch-idp-certs.py <metadata url> [<entity ID>]
```
