# CommonJsModules Lambda Layer

## Directory Structure

The CommonJsModules lambda layer follows a specific directory structure to organize JavaScript modules effectively:

- **opt**: This directory stores JavaScript modules.
- **lib**: Node.js modules installed via npm are stored here to provide global access within the Lambda environment when deployed.

### `opt` Directory

The `opt` directory contains the following subdirectories:

- **config**: Contains JavaScript files that export configuration data. For instance, the `config/env.js` file exports environment variables loaded from `env.json` and `env.secrets.json`.
- **models**: Stores Mongoose models. These models are generally not intended for use outside this layer.
- **services**: Abstractions on models, providing typedefs, methods, and atomic transactions. These services are designed with possible business logic in mind. For example, the room service treats a room as a room and offers functions specific to room operations.
- **types**: Contains enums, interfaces, and typedefs primarily used by services.
- **util**: Houses utility functions.
- **validator**: Contains modules responsible for validating requests (headers, body, params, and queries) and responses.

Additionally, `env.json` and `env.secrets.json` files store environment data, serving as alternatives to using a `.env` file.

### `lib` Directory
The `lib` directory includes:

- **node_modules**: This directory stores packages installed via npm.
- **package.json**: Contains dependencies.

Note: Please use `npm install` to install packages in the `lib` directory. Don't use any other package manager.

## Usage

In Lambda functions that utilize the CommonJsModules lambda layer, modules within the `opt` directory can be accessed using the relative path "opt/path/module.js". Meanwhile, packages installed in the `lib` directory can be required directly.

Note: When importing modules from the `opt` directory, ensure that the path is relative to unix root `/`.

For example:
```javascript
// In a different Lambda function
const mongoose = require("/opt/config/mongoose"); // load a configured mongoose instance
const env = require("/opt/config/env");           // load environment variables
const Joi = require("joi");                       // load a package installed in the lib directory
```
