function (data, dataType, dataPath) {
  'use strict';

  var foundValid = false
    , errs = validate.errors.length;

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var valid = ({{= it.validate($it) }})(data, dataType, dataPath);

    if (valid) {
      if (foundValid) {
        validate.errors.push({
          keyword: 'oneOf',
          schema: validate.schema{{= it.schemaPath }},
          dataPath: dataPath,
          message: 'should match exactly one schema in oneOf'
          {{? it.opts.verbose }}, data: data{{?}}
        });
        return false;
      }
      foundValid = true;
    }
  {{~}}

  if (foundValid) validate.errors.length = errs;
  else validate.errors.push({
    keyword: 'oneOf',
    schema: validate.schema{{= it.schemaPath }},
    dataPath: dataPath,
    message: 'should match exactly one schema in oneOf'
    {{? it.opts.verbose }}, data: data{{?}}
  });

  return foundValid;
}