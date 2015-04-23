(function(angular) {
	'use strict';

	/**
	 * @module xpsui:controllers
	 */
	angular.module('xpsui:controllers', ['xpsui:services'])
		/**
		 *
		 * Requires:
		 * * #routeParams contain 'schema' 
		 */
	.controller('xpsui:RegistrySearchCtrl', [ 
		'$scope', 
		'$routeParams',
		'xpsui:SchemaUtil',
		'$translate',
		'$http',
		'$parse',
		'xpsui:logging',
		'xpsui:QueryFilter',
		function($scope, $routeParams, schemaUtil, $translate, $http, $parse, log, QueryFilter) {

			//FIXME this function must be replaced by generic objecttools function shared among client and server if poosible
			$scope.objectPathToSchemaPath = function(objPath) {
				if (objPath) {
					return 'properties.'+objPath.replace(/\./g, '.properties.');
				} else {
					return null;
				}
			};

			$scope.addNewCrit = function() {
				$scope.searchCrits.push({
					op: $scope.allOps[0]
				});
			};

			$scope.removeCrit = function(idx) {
				$scope.searchCrits.splice(idx, 1);
			};

			$scope.search = function() {
				var qf = QueryFilter.create();
				
				for (var i = 0; i <$scope.searchCrits.length; ++i) {
					qf.addCriterium(
						$scope.searchCrits[i].field.path,
						QueryFilter.operation[$scope.searchCrits[i].op.op],
						$scope.searchCrits[i].val
					);
				}

				console.log(qf);
				$http({
					url: '/search/' + schemaUtil.encodeUri(schemaUri),
					method: 'POST',
					data: qf
				}).success(function(data, status, headers, config) {
					$scope.data = flattenData(data, $scope.schema.listFields);
				}).error(function(err) {
					// FIXME notification
				});
			};

			var schemaUri = schemaUtil.decodeUri($routeParams.schema);
			$scope.schema = null;

			// prepare known operations
			$scope.allOps = [];
			
			for (var i in QueryFilter.operation) {
				if (QueryFilter.operation.hasOwnProperty(i)) {
					$scope.allOps.push({
						text: $translate.instant('queryfilter.ops.' + (QueryFilter.operation[i].text || i)),
						op: (QueryFilter.operation[i].code || i)
					});
				}
			}

			$scope.searchCrits = []; // actual row

			function flattenSchema(schema, path, group) {
				var result = [];

				if (!(path && angular.isArray(path))) {
					path = [];
				}

				if (schema.properties) {
					for (var propertyName in schema.properties) {
						if (schema.properties.hasOwnProperty(propertyName)) {
							var property = schema.properties[propertyName];
							var propertyTitle = $translate.instant(property.transCode || property.title);
							var localPath = path.concat(propertyName);

							if (property.properties) {
								result = result.concat(flattenSchema(property, localPath, propertyTitle));
							} else {
								// property has no additional properties
								result.push({
									name: propertyTitle,
									path: localPath.join('.'),
									group: group,
									fragment: property
								});

							}
						}
					}
				}

				return result;
			}

			function flattenData(data, fields) {
				var result = [];

				if (data && angular.isArray(data)) {
					for (var d in data) {
						var dataRow= {};
						for (var f in fields) {
							dataRow[fields[f].field] = $parse(fields[f].field)(data[d]);
						}

						result.push(dataRow);
					}
				}

				return result;
			}

			schemaUtil.getCompiledSchema(schemaUri)
			.success(function(data) {
					$scope.schema = data;
					$scope.schemaFields = flattenSchema(data, '');
				}
			)
			.error(function() {
				log.error('Failed to get schema');
				//TODO notification anbout error state
			});

		}]);

}(window.angular));

