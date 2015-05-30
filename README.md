# ajv - Another JSON schema Validator

## TODO

- remote refs
- custom formats (via options)
- schema validation before compilation
- bundle compiled templates (doT will be dev dependency)
- unicode option


## Install

```
npm install ajv
```


## Usage

```
var ajv = require('ajv')(options);
var validate = ajv.compile(schema);
var valid = validate(data);
if (!valid) console.log(validate.errors);
```

or

```
// ...
var valid = ajv.validate(schema, data);
// ...
```

ajv compiles schemas to functions and caches them in both cases (using stringified schema as a key - using [json-stable-stringify](https://github.com/substack/json-stable-stringify)), so that the next time the same schema is used (not necessarily the same object instance) it won't be compiled again.


## Options

- _allErrors_: if true, jv will continue validating all rules collecting all errors (false by default)
- _verbose_: include the reference to the validated data in the errors (false by default)
- _format_: if false, the formats won't be validated (true by default)
- _unicode_: if true, the lengths of strings with unicode pairs will be correct (false by default) - not implemented yet.