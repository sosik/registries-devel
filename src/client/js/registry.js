angular.module('registry', ['schema-utils', 'psui', 'psui.form-ctrl', 'psui-objectlink', 'psui-default-src', 'psui-selectbox'])
.controller('registry.newCtrl', ['$route',
		'$scope',
		'$routeParams',
		'$http',
		'$location',
		'schema-utils.SchemaUtilFactory',
		'psui.notificationFactory',
		function($route, $scope, $routeParams, $http, $location,schemaUtilFactory,notificationFactory) {
	$scope.currentSchemaUri = schemaUtilFactory.decodeUri($routeParams.schema);

	$scope.model = {};
	$scope.model.obj = {};
	
	$scope.schemaFormOptions = {
		modelPath: 'model.obj',
		schema: {}
	};

	$scope.save = function() {
		$scope.newForm.psui.prepareForSubmit();
		if ($scope.newForm.$invalid) {
			notificationFactory.error({translationCode: 'registry.form.not.filled.correctly', time: 5000});
			return;
		}

		$http({url: '/udao/saveBySchema/'+schemaUtilFactory.encodeUri(schemaUtilFactory.concatUri($scope.currentSchemaUri , 'new')), method: 'PUT',data: $scope.model.obj})
		.success(function(data, status, headers, config){
			notificationFactory.clear();
			$location.path('/registry/view/' + schemaUtilFactory.encodeUri($scope.currentSchemaUri) + '/' + data.id);
		}).error(function(err) {
			notificationFactory.error({translationCode:'registry.unsuccesfully.saved', time:3000});
		});
	};

	$scope.cancel = function() {
		$route.reload();
	};

	schemaUtilFactory.getCompiledSchema($scope.currentSchemaUri, 'new').success(function(data) {
		$scope.schemaFormOptions.schema = data;
		schemaUtilFactory.generateObjectFromSchema($scope.schemaFormOptions.schema, $scope.model.obj);
	}).error(function(err) {
		notificationFactory.error(err);
	});
}])
.controller('registry.viewCtrl', ['$scope', '$routeParams', '$http', '$location','schema-utils.SchemaUtilFactory','psui.notificationFactory', function($scope, $routeParams, $http, $location,schemaUtilFactory,notificationFactory) {
	$scope.currentSchema = $routeParams.schema;
	$scope.currentId = $routeParams.id;
	$scope.currentSchemaUri = schemaUtilFactory.decodeUri($routeParams.schema);

	$scope.model = {};
	$scope.model.obj = {};
	
	$scope.schemaFormOptions = {
		modelPath: 'model.obj',
		schema: {}
	};

	$scope.save = function() {
		$http({url: '/udao/saveBySchema/'+schemaUtilFactory.encodeUri(schemaUtilFactory.concatUri($scope.currentSchemaUri, 'new')), method: 'PUT',data: $scope.model.obj})
		.success(function(data, status, headers, config){
			notificationFactory.info({translationCode:'registry.succesfully.saved', time:3000});
		})
		.error(function(data, status, headers, config) {
			notificationFactory.error({translationCode:'registry.unsuccesfully.saved', time:3000});
		});
	}

	$scope.$on('psui:model_changed', function() {
		$scope.save();
	});
	var schemaUri = schemaUtilFactory.decodeUri($routeParams.schema);

	schemaUtilFactory.getCompiledSchema(schemaUri, 'view')
	.success(function(data) {
		$scope.schemaFormOptions.schema = data;
		
		$http({ method : 'GET',url: '/udao/getBySchema/'+schemaUtilFactory.encodeUri(schemaUtilFactory.concatUri(schemaUri, 'view'))+'/'+ $scope.currentId})
		.success(function(data, status, headers, config){
			schemaUtilFactory.generateObjectFromSchema($scope.schemaFormOptions.schema, $scope.model.obj);
			$scope.model.obj = data;
		}).error(function(err) {
			notificationFactory.error(err);
		});
		
	})
}])
/**
 * places validation mark to element
 */
.directive('psuiInlineedit', ['$timeout', '$compile', '$parse', function($timeout, $compile, $parse) {
	return {
		restrict: 'A',
		require: ['^ngModel', '^?psuiFormCtrl'],
		link: function(scope, elm, attrs, controller) {
			var mode = attrs.psuiInlineedit;
			var wrapper;
			var oldValue = '';

			var commit = function() {
			}

			var cancel = function() {
			}

			var ngModel = null;
			if (controller[0]) {
				ngModel = controller[0];
			}
			var viewElement;
			if (elm.prop('tagName') == 'PSUI-OBJECTLINK') {
				viewElement = angular.element($compile('<div psui-objectlink-view class="override-before" ng-model='+attrs.ngModel +' schema-fragment='+attrs.schemaFragment+'></div>')(scope));
			} else if (elm.prop('tagName') == 'PSUI-ARRAY-CONTROL') {
				console.log('inlineeditscope', scope);
				viewElement = angular.element($compile('<div class="override-before"><div ng-repeat="ae in ' + attrs.ngModel + '" psui-objectlink-view ng-model="ae" schema-fragment="'+attrs.schemaFragment+'.items">x</div></div>')(scope));
			} else if (elm.prop('tagName') == 'PSUI-SELECTBOX') {
				viewElement = angular.element($compile('<div psui-selectbox-view ng-model='+attrs.ngModel +' schema-fragment='+attrs.schemaFragment+'></div>')(scope));
			} else if (elm.prop('tagName') == 'PSUI-UPLOADABLE-IMAGE') {
				viewElement = angular.element($compile('<div><img ng-src="{{'+attrs.ngModel +'}}" src="" psui-default-src="/img/no_photo.jpg"></img></div>')(scope));
			} else {
				viewElement = angular.element($compile('<div ng-bind='+attrs.ngModel +'></div>')(scope));
			}
			viewElement.addClass('psui-inlineedit-view');
			// there is ngModel, define commit and cancel
			if (ngModel) {
/*				ngModel.$render = function() {
					elm.val(ngModel.$viewValue || '');
					//viewElement.text(ngModel.$viewValue || '');
				}

				scope.$watch(function(scope) {return ngModel.$viewValue;}, function() {
					//viewElement.text(ngModel.$viewValue || '');
				})
*/
				commit = function() {
/*					scope.$apply( function() {
						ngModel.$setViewValue(elm.val());
					});
*/					changeMode('view');
					scope.$emit('psui:model_changed');
				}

				cancel = function() {
/*					elm.val(oldValue);
 */
						//elm.val(oldValue);
						//ngModel.$setViewValue(oldValue);
					$parse(attrs.ngModel).assign(scope, oldValue);
					console.log(oldValue);
					changeMode('view');
				}

			}

			var psuiFormCtrl;
			if (controller[1]) {
				var psuiFormCtrl = controller[1];

				scope.$watch(
					psuiFormCtrl.getActiveControl,
					function(newVal, oldVal) {
						if (newVal !== elm && oldVal === elm && mode === 'edit') {
							cancel();
						}
					}
				);
			}

			elm.addClass('psui-inlineedit-edit');
			// create base html elements
			if (elm.parent().hasClass('psui-wrapper')) {
				// element is wrapped, we are going to use this wrapper
				wrapper = angular.element(elm.parent());
			} else {
				// there is no wrapper, we have to create one
				wrapper = angular.element('<span class="psui-wrapper"></span>');
				elm.wrap(wrapper);
			}

			// check it there is psui-buttons-holder
			var wrapperChildren = wrapper.children();
			var actionsHolder = null;
			for (var i = 0; i<wrapperChildren.length; i++) {
				if (angular.element(wrapperChildren[i]).hasClass('psui-actions-holder')) {
					actionsHolder = angular.element(wrapperChildren[i]);
				}
			}

			if (!actionsHolder) {
				console.log('No button holder');
				actionsHolder = angular.element('<span class="psui-actions-holder"></span>');
				wrapper.append(actionsHolder);
			}

			var commitBtn = angular.element($compile('<span class="psui-btn psui-commit-btn"><i></i><span>{{\'psui-objectlink.btn.save\'|translate}}</span></span>')(scope));
			var cancelBtn = angular.element($compile('<span class="psui-btn psui-cancel-btn"><i></i><span>{{\'psui-objectlink.btn.cancel\'|translate}}</span></span>')(scope));
//			var editBtn = angular.element('<span class="psui-edit-btn"><i></i><span>edit</span></span>');

			if (ngModel) {
				// disable commitbutton if invalid
				scope.$watch(
					function(scope) {return ngModel.$invalid;},
					function(nv, ov) {
						if (ngModel.$invalid) {
							commitBtn.addClass('psui-hidden');
						} else {
							if (mode === 'edit') {
								commitBtn.removeClass('psui-hidden');
							}
						}
					}
				);
			}

			actionsHolder.append(commitBtn);
			actionsHolder.append(cancelBtn);
//			actionsHolder.append(editBtn);

			wrapper.prepend(viewElement);
			//viewElement.text(elm.val());

			var changeMode = function(newMode) {
				//TODO validate newMode
				mode = newMode;

				if (mode === 'view') {
//					editBtn.removeClass('psui-hidden');
					commitBtn.addClass('psui-hidden');
					cancelBtn.addClass('psui-hidden');
					//viewElement.text(elm.val());
					viewElement.removeClass('psui-hidden');
					elm.addClass('psui-hidden');
//					if (editBtnHideTimeout) {
//						$timeout.cancel(editBtnHideTimeout);
//						editBtnHideTimeout = null;
//					}
//					editBtnHideTimeout = $timeout(function() {
//						editBtn.addClass('psui-hidden');
//					}, 500);
				} else if (mode === 'edit') {
//					editBtn.addClass('psui-hidden');
					commitBtn.removeClass('psui-hidden');
					cancelBtn.removeClass('psui-hidden');
					viewElement.addClass('psui-hidden');
					elm.removeClass('psui-hidden');
					oldValue = angular.copy(ngModel.$modelValue);
					// monitor who has focus
					scope.$apply(function() {
						psuiFormCtrl.setActiveControl(elm);
					});
				}
			}

			commitBtn.on('click', function(evt) {
				commit();
				changeMode('view');
			});

			cancelBtn.on('click', function(evt) {
				scope.$apply(function() {
					cancel();
				});
			});

//			editBtn.on('click', function(evt) {
//				changeMode('edit');
//			});

			viewElement.on('click', function(evt) {
				changeMode('edit');
			});

//			var editBtnHideTimeout;
//
//			editBtn.on('mouseover', function(evt) {
//				editBtn.removeClass('psui-hidden');
//				if (editBtnHideTimeout) {
//					$timeout.cancel(editBtnHideTimeout);
//					editBtnHideTimeout = null;
//				}
//			});

//			wrapper.on('mouseover', function(evt) {
//				if (mode === 'view') {
//					editBtn.removeClass('psui-hidden');
//				if (editBtnHideTimeout) {
//					$timeout.cancel(editBtnHideTimeout);
//					editBtnHideTimeout = null;
//				}
//				}
//			});
//			wrapper.on('mouseleave', function(evt) {
//				if (mode === 'view') {
//					if (editBtnHideTimeout) {
//						$timeout.cancel(editBtnHideTimeout);
//						editBtnHideTimeout = null;
//					}
//					editBtnHideTimeout = $timeout(function() {
//						editBtn.addClass('psui-hidden');
//					}, 500);
//				}
//			});

			elm.on('keypress keydown', function(evt) {
				if (evt.which === 27) {
					cancel();
					evt.preventDefault();
				} else if (evt.which === 13) {
					commit();
					evt.preventDefault();
				} else if (evt.which === 9) {
					commit();
				}
			});


			changeMode(mode);
		}
	}
}])
.directive('psuiAppendToArray', ['$parse', 'psui.notificationFactory', function($parse, notifications) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var arrayPath = attrs.psuiAppendToArray;
			var arrayGetter = $parse(arrayPath);

			element.on('click', function(evt) {
				scope.$apply(function() {
					if (arrayGetter(scope).indexOf('') < 0) {
						arrayGetter(scope).push({});
					} else {
						notifications.warn({translationCode:'registry.duplicate.forbidden', time:3000});
					}
				});
				evt.preventDefault();
			});
		}
	}
}])
.directive('psuiSchemaForm', ['$compile', function($compile) {
	return {
		restrict: 'A',
		transclude: true,
		link: function(scope, element, attrs, controller) {
			var options = scope[attrs.psuiSchemaForm];

			var render = function() {
				var properties = options.schema.properties;
				if (options.schema.transCode){
					var registryTitle = angular.element('<h1>{{\'' + options.schema.transCode +'\' | translate }}</h1>');
					element.append(registryTitle);
					$compile(registryTitle)(scope);
				} else if (options.schema.title){
					var registryTitle = angular.element('<h1>' + options.schema.title +'</h1>');
					element.append(registryTitle);
				}
				console.log(properties);
				angular.forEach(properties, function(value, key) {
					if (value.type === 'object') {
						var fieldSet = angular.element('<fieldset></fieldset>');
						element.append(fieldSet);
						fieldSet.wrap('<div class="col-md-6"></div>');
						fieldSet.append('<legend>'+(value.transCode ? '{{\''+ value.transCode+'\'| translate}}' : value.title)+'</legend>');
						angular.forEach(value.properties, function(value2, key2) {
							var isRequired = (value2.required ? ' psui-required': '');
							var formGroup = angular.element('<div class="form-group"></div>');

							var fieldHolder = angular.element('<div class="col-sm-8"></div>');
							var fieldHolderInner = angular.element('<div class="input-group"></div>');
							fieldHolder.append(fieldHolderInner);
							
							var label = angular.element('<label class="col-sm-4 control-label'+isRequired+'">'+(value2.transCode ? '{{\''+ value2.transCode+'\'| translate}}' : value2.title)+'</label>');

							formGroup.append(label);
							formGroup.append(fieldHolder);

							var input;

							if (value2.type === 'array') {
								//input = angular.element('<div class="input-group" ng-repeat="ae in '+options.modelPath+'.'+key+'.'+key2+' track by $id(ae)"></div>')
								//fieldHolderInner.append(angular.element('<div><button type="button" class="btn pull-right" psui-append-to-array="'+options.modelPath+'.'+key+'.'+key2+'">Pridať</button></div>'));
								//input.append(angular.element('<psui-objectlink psui-validity-mark schema-fragment="'+attrs.psuiSchemaForm+'.schema.properties.'+key+'.properties.'+key2+'.items" ng-model="'+options.modelPath+'.'+key+'.'+key2+'[$index]"></psui-objectlink>'));
								input = angular.element('<psui-array-control schema-fragment="'+attrs.psuiSchemaForm+'.schema.properties.'+key+'.properties.'+key2+'" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"></psui-array-control>');
							} else {

								if (value2.$objectLink) {
									input = angular.element('<psui-objectlink psui-validity-mark schema-fragment="'+attrs.psuiSchemaForm+'.schema.properties.'+key+'.properties.'+key2+'" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"></psui-objectlink>');
								} else if (value2.render && value2.render.component === 'psui-datepicker') {
									input = angular.element('<input psui-validity-mark psui-datepicker type="text" class="form-control" placeholder="" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								} else if (value2.render && value2.render.component === 'psui-selectbox') {
									input = angular.element('<psui-selectbox schema-fragment="'+attrs.psuiSchemaForm+'.schema.properties.'+key+'.properties.'+key2+'" psui-validity-mark class="form-control" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								} else if (value2.render && value2.render.component === 'psui-uploadable-image') {
									input = angular.element('<psui-uploadable-image '
									+ 'psui-imageresizor psui-imageresizor-width="' +value2.render.width
										+ '" psui-imageresizor-height="'+value2.render.height + '" psui-validity-mark ng-model="'+options.modelPath+'.'+key+'.'+key2+'" style="'+(value2.render.width ? 'width:'+value2.render.width+'px !important;':'')+(value2.render.height ? 'height:'+value2.render.height+'px !important;':'')+'"/></psui-uploadable-image>');
								} else {
									input = angular.element('<input psui-validity-mark type="text" class="form-control" placeholder="" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								}

								// validations
								if (value2.required) {
									input.attr('required', true);
								}

							}

							fieldHolderInner.append(input);
							fieldSet.append(formGroup);
						});

						//var tableElm = generateTableElement(value.title);
						$compile(fieldSet)(scope);
						
						//generateTableRows(tableElm, properties[key], 'formObject.'+key);
					} else {
					}
					//element.append('<div class="ps-table-row"><div class="ps-table-label">Priezvisko:</div><div class="ps-table-value"><ps-gui-clickedit-text show-buttons="false" ng-model="tezt">Stárek</ps-gui-clickedit-text></div></div>');
				});
			};

			scope.$watchCollection(function() {return options}, function() {
				console.log('options changed');
				render();
			});
		}
	}
}])
.directive('psuiArrayControl', ['$compile', function($compile) {
	return {
		restrict: 'E',
		scope: {
			'ngModel' : '=',
			'schemaFragment' : '='
		},
		template: '<div style="position: relative;" class="input-group" ng-repeat="ae in ngModel track by $id(ae)">'
					+ '<button style="position: absolute; right: 100%;" class="psui-btn" ng-click="removeByIndex($index);"><i class="glyphicon-minus"></i>Odstrániť</button><psui-objectlink psui-validity-mark schema-fragment="schemaFragment.items" ng-model="ngModel[$index]"></psui-objectlink>'
					+'</div>'
					+ '<button class="psui-btn pull-right" ng-click="appendNew();"><i class="glyphicon-plus"></i> Pridať</button>',
		link: function(scope, element, attrs, controller) {
			console.log(scope.psuiModel);
			console.log(scope.schemaFragment);

			var modelChanged = function() {
				console.log('model changed', scope.ngModel);
			}

			scope.$watchCollection('ngModel', modelChanged);

			scope.removeByIndex = function(idx) {
				scope.ngModel.splice(idx,1);
			}

			scope.appendNew = function() {
				scope.ngModel.push({});
			}

		}
	}
}])
.directive('psuiSchemaForm2', ['$compile', function($compile) {
	return {
		restrict: 'A',
		transclude: true,
		link: function(scope, element, attrs, controller) {
			var options = scope[attrs.psuiSchemaForm2];

			var render = function() {
				if (options.schema.transCode){
					var registryTitle = angular.element('<h1>{{\'' + options.schema.transCode +'\' | translate }}</h1>');
					element.append(registryTitle);
					$compile(registryTitle)(scope);
				} else if (options.schema.title){
					var registryTitle = angular.element('<h1>' + options.schema.title +'</h1>');
					element.append(registryTitle);
				}
				var properties = options.schema.properties;
				console.log(properties);
				angular.forEach(properties, function(value, key) {
					if (value.type === 'object') {
						var fieldSet = angular.element('<fieldset></fieldset');
						element.append(fieldSet);
						fieldSet.wrap('<div class="col-md-6"></div>');
						fieldSet.append('<legend>'+(value.transCode ? '{{\''+ value.transCode+'\'| translate}}' : value.title)+'</legend>');
						angular.forEach(value.properties, function(value2, key2) {
							var isRequired = (value2.required ? ' psui-required': '');

							var formGroup = angular.element('<div class="form-group"></div>');
							var label = angular.element('<label class="col-sm-4 control-label'+isRequired+'">'+(value2.transCode ? '{{\''+ value2.transCode+'\'| translate}}' : value2.title)+'</label>');
							
							var fieldHolder = angular.element('<div class="col-sm-8"></div>');
							var fieldHolderInner = angular.element('<div class="input-group"></div>');
							fieldHolder.append(fieldHolderInner);

							formGroup.append(label);
							formGroup.append(fieldHolder);

							var isRequired = (value2.required ? ' psui-required': '');
							var input;

							if (value2.type === 'array') {
								//input = angular.element('<div style="border-bottom: 1px silver dotted;" class="input-group" ng-repeat="ae in '+options.modelPath+'.'+key+'.'+key2+' track by $id(ae)"></div>')
								//fieldHolderInner.append(angular.element('<div><button type="button" class="btn pull-right" psui-append-to-array="'+options.modelPath+'.'+key+'.'+key2+'">Pridať</button></div>'));
								//input.append(angular.element('<psui-objectlink psui-inlineedit="view" psui-validity-mark schema-fragment="'+attrs.psuiSchemaForm2+'.schema.properties.'+key+'.properties.'+key2+'.items" ng-model="'+options.modelPath+'.'+key+'.'+key2+'[$index]"></psui-objectlink>'));
								input = angular.element('<psui-array-control psui-inlineedit="view" schema-fragment="'+attrs.psuiSchemaForm2+'.schema.properties.'+key+'.properties.'+key2+'" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"></psui-array-control>');
							} else {
								if (value2.$objectLink) {
									input = angular.element('<psui-objectlink psui-inlineedit="view" schema-fragment="'+attrs.psuiSchemaForm2+'.schema.properties.'+key+'.properties.'+key2+'" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"></psui-objectlink>');
								} else if (value2.render && value2.render.component === 'psui-datepicker') {
									input = angular.element('<input psui-validity-mark psui-datepicker psui-inlineedit="view" type="text" class="form-control" placeholder="" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								} else if (value2.render && value2.render.component === 'psui-selectbox') {
									input = angular.element('<psui-selectbox psui-inlineedit="view" schema-fragment="'+attrs.psuiSchemaForm2+'.schema.properties.'+key+'.properties.'+key2+'" psui-validity-mark class="form-control" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								} else if (value2.render && value2.render.component === 'psui-uploadable-image') {
									input = angular.element('<psui-uploadable-image psui-inlineedit="view"'
										+ 'psui-imageresizor psui-imageresizor-width="' +value2.render.width
										+ '" psui-imageresizor-height="'+value2.render.height + '" ng-model="'+options.modelPath+'.'+key+'.'+key2+'" style="'+(value2.render.width ? 'width:'+value2.render.width+'px !important;':'')+(value2.render.height ? 'height:'+value2.render.height+'px !important;':'')+'"/></psui-uploadable-image>');
								} else {
									input = angular.element('<input psui-validity-mark psui-inlineedit="view" type="text" class="form-control" placeholder="" ng-model="'+options.modelPath+'.'+key+'.'+key2+'"/>');
								}
							}
							// validations
							if (value2.required) {
								input.attr('required', true);
							}
	
							fieldHolderInner.append(input);
							fieldSet.append(formGroup);
						});

						//var tableElm = generateTableElement(value.title);
						$compile(fieldSet)(scope);
						
						//generateTableRows(tableElm, properties[key], 'formObject.'+key);
					} else {
					}
					//element.append('<div class="ps-table-row"><div class="ps-table-label">Priezvisko:</div><div class="ps-table-value"><ps-gui-clickedit-text show-buttons="false" ng-model="tezt">Stárek</ps-gui-clickedit-text></div></div>');
				});
			};

			scope.$watchCollection(function() {return options}, function() {
				console.log('options changed');
				render();
			});
		}
	}
}])
.directive('psSchemaForm', ['$compile', function($compile){
	return {
		restrict: 'E',
		scope: {
			formSchema: "=",
			formObject: "=",
			formObjectText: "@formObject",
			saveActionText: '@saveAction',
			saveAction: '=saveAction'

		},
		transclude: true,
		link: function(scope, element, attrs, controller) {
			var generateTableElement = function(title) {
				var tableElm = angular.element('<table class="ps-schema-form-table"></table>');
				var headerElm = angular.element('<tr class="ps-schema-form-header"><td colspan=2>'+title+'</td></tr>');
				return tableElm.append(headerElm);
			}

			var generateTableRows = function(tableElm, schemaPart, modelPath) {
				angular.forEach(schemaPart.properties, function(value, key){
					var rowElm = angular.element('<tr><td>'+value.title+'</td><td><ps-gui-clickedit-text render-mode="'+scope.renderMode+'" show-buttons="'+scope.showButtons+'" ng-model="'+modelPath+'.'+key+'" ng-required="true" save-action="saveAction"></ps-gui-clickedit-text></td><tr>');
					$compile(rowElm)(scope);
					tableElm.append(rowElm);
				});


			}

			var doLink = function() {
				if (!scope || !scope.formSchema) {
					return;
				}
				var properties = scope.formSchema.properties;
				angular.forEach(properties, function(value, key) {
					if (value.type === 'object') {
						var tableElm = generateTableElement(value.title);
						$compile(tableElm)(scope);
						element.append(tableElm);
						
						generateTableRows(tableElm, properties[key], 'formObject.'+key);
					} else {
					}
					//element.append('<div class="ps-table-row"><div class="ps-table-label">Priezvisko:</div><div class="ps-table-value"><ps-gui-clickedit-text show-buttons="false" ng-model="tezt">Stárek</ps-gui-clickedit-text></div></div>');
				});
			}

			scope.$watch(function() {return scope.formSchema}, function() {
				doLink();
			});
		}
	};
}]);

