(function(angular) {
	'use strict';

	angular.module('xpsui:directives')
	.directive('xpsuiCalculable', ['xpsui:logging', '$parse', 'xpsui:Calculator', function(log, $parse, calculator) {
		return {
			restrict: 'A',
			controller: function() {
			},
			require: ['?xpsuiFormControl', '^xpsuiForm', 'ngModel'],
			link: function(scope, elm, attrs, ctrls) {
				var formControl = ctrls[0];
				var form = ctrls[1];
				var ngModel = ctrls[2];

				var fieldDef = $parse(attrs.xpsuiCalculable)(scope);
				if (fieldDef && fieldDef.calculated) {
					scope.$watch(
						'model.obj',
						function(newVal, oldVal, $currentScope) {
							var newValue = calculator.createProperty(fieldDef.calculated).getter(scope);
							console.log('Model changed updating calculated value ' + attrs.xpsuiCalculable);
							console.log('New value: ' + newValue);
							$parse(attrs.ngModel).assign(scope, newValue);
						}
					);
				}
				if (fieldDef && fieldDef.defaultCalculated) {
					scope.$watch(
						'model.obj.id',
						function(newVal, oldVal, $currentScope) {
							var newValue = calculator.createProperty(fieldDef.defaultCalculated).getter(scope);
							console.log('Model changed setting calculated default ' + attrs.xpsuiCalculable);
							console.log('New value: ' + newValue);
							$parse(attrs.ngModel).assign(scope, newValue);
							//ngModel.$setViewValue(newValue);
							// No idea why only this works.
							//calculator.createProperty(fieldDef.defaultCalculated).setter(scope);
							if (scope.model.obj && scope.model.obj.baseData) {
								scope.model.obj.baseData.vypoc = newValue;
							}
							ngModel.viewValue = newValue;
							ngModel.modelValue = newValue;
							$parse(attrs.ngModel).assign(scope, newValue);
						}
					);
				}
				
/*
				"vypoc": {
					"title": "Vypocitane",
					"transCode": "schema.people.vypocitane",
					"type": "string",
					"calculated": { "func": "get", "args": { "path": "model.obj.baseData.name" }},
					"required": false
				},

 */
			}
		};
	}]);

}(window.angular));
