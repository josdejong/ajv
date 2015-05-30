{{ /**
    * schema compilation (render) time:
    * it = { schema, RULES, _validate, opts }
    * it.validate - this template function,
    *   it is used recursively to generate code for subschemas
    *
    * runtime:
    * "validate" is a variable name to which this function will be assigned
    * copy, getDataType etc. are defined in the parent scope in index.js
    */ }}

function (data, dataType, dataPath) {
  'use strict';

  if (!dataType) {
    dataType = getDataType(data);
    validate.errors.length = 0;
    dataPath = '';
  }

  var errs = validate.errors.length;

  {{~ it.RULES:$rulesGroup }}
    {{? $shouldUseGroup($rulesGroup) }}
      {{? $rulesGroup.type }} if (dataType == '{{= $rulesGroup.type }}') { {{?}}
        {{~ $rulesGroup.rules:$rule }}
          {{? $shouldUseRule($rule) }}
            {{? $rule.inline }}
              {{= $rule.code(it) }}
            {{??}}
              {{
                var $it = it.copy(it);
                $it.schema = it.schema[$rule.keyword];
                $it.schemaPath = it.schemaPath + '.' + $rule.keyword;
                $it.parentSchema = it.schema;
                $it.parentSchemaPath = it.schemaPath;
              }}
              {{? !it.opts.allErrors }} var valid = {{?}}
                ({{= $rule.code($it) }})(data, dataType, dataPath);
            {{?}}

            {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
          {{?}}
        {{~}}
      {{? $rulesGroup.type }} } {{?}}
    {{?}}
  {{~}}

  return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
}

{{
  function $shouldUseGroup($rulesGroup) {
    return $rulesGroup.rules.some(function ($rule) {
      return $shouldUseRule($rule);
    });
  }

  function $shouldUseRule($rule) {
    var $use = it.schema.hasOwnProperty($rule.keyword);
    if (!$use && $rule.keyword == 'properties') {
      var $pProperties = it.schema.patternProperties
        , $aProperties = it.schema.additionalProperties;
      $use = ($pProperties && Object.keys($pProperties).length) ||
             ($aProperties === false || typeof $aProperties == 'object');
    }
    return $use;
  }
}}