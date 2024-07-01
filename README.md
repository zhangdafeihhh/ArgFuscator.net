# ArgFuscator

ArgFuscator is an open-source, stand-alone web application that enables the application of [command-line obfuscation](https://www.wietzebeukema.nl/) to common system-native executables.

🚀 **Use the live version of ArgFuscator via [ArgFuscator.net](https://argfuscator.net/)**

## Summary

## Goal

## Local development

To run ArgFuscator yourself, follow the following steps:

0. Prerequirements:
    1. Clone this repository
    2. Install TypeScript (e.g. `apt install tsc`)

1. From the main folder of this repostitory, run the following command:

   ```bash
   tsc -w --project src/ --outfile gui/assets/js/main.js
   ```

2. Open `gui/index.html` in your web browser.
   _Note: for some functionality, your browser may require you to run the static content from the `http(s)://` scheme (rather than `file://`). You may achieve this, for example, by running `python3 -m http.server` from the main folder of this repository, then navigating to `http://localhost:8000/gui/`._
