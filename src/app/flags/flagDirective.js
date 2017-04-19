angular.module('oaa.ui')
	.directive('flag', ['countryService', function (countryService) {
		return {
			restrict: 'E',
			scope: {
				country: '=',
				size: '=',
				flagOnly: '='
			},
			templateUrl: 'app/oaa/ui/flags/flagDirective.html',
			link: function(scope, elem, attrs) {
				scope.loading = 1;
				
				scope.getFlagClasses = function() {
					var flagClass = "display:none;";
					try {
						flagClass = 'flag-icon-background flag-icon-' + scope.country.GlyphIconFlagCode.toLowerCase();
					}
					catch(e) {
						//flag wasn't loaded yet
					}
					return flagClass;
				};
				
				scope.getFlagDimensions = function() {
					return { 
						'width': scope.width + 'px',
						'height': scope.height + 'px'
					};
				};
				
				function initialize() {

					switch(scope.size) {
						case 'small': 
							scope.height = 75;
							scope.width = 100;
							break;
						case 'medium': 
							scope.height = 112;
							scope.width = 150;
							break;
						case 'large': 
							scope.height = 150;
							scope.width = 200;
							break;
						default:
							scope.height = 75;
							scope.width = 100;
					}
					
					//country name was passed in as a string and needs to be resolved
					if( scope.country && !scope.country.Title ) {
						scope.loading++;
						countryService.getByFilter("Title eq '" + scope.country + "'")
							.then(function(countries){
								scope.country = countries[0];
								scope.loading--;
							});
					}
					scope.loading--;
				}
				
				initialize();
			}
		};
	}]);