angular.module('CVGTool')

/*
 * Controller of admin page "Users"
 */
.controller('taskHomeCtrl', ['$scope', '$state', '$mdDialog', 'navSrvc', function($scope, $state, $mdDialog, navSrvc) {
    $scope.slider = { // Options and values for the slider
        from: 1,
        to: 1,
        options: {
            floor: 1,
            ceil: 100000,
            step: 1
        },
    };

    // Function called everytime the number input of the slider is changed to check those values
    $scope.checkSlider = function() {
        if ($scope.slider.from < $scope.slider.options.floor) {
            $scope.slider.from = $scope.slider.options.floor;
        }

        if ($scope.slider.to > $scope.slider.options.ceil) {
            $scope.slider.to = $scope.slider.options.ceil
        }

        if ($scope.slider.from > $scope.slider.to) {
            var aux = $scope.slider.from;
            $scope.slider.from = $scope.slider.to;
            $scope.slider.to = aux;
        }
    };

    $scope.goToTool = function() {
        if (navSrvc.getActiveDataset() == undefined || navSrvc.getActiveDataset().name === undefined || navSrvc.getActiveDataset().name.localeCompare("") == 0) {
            window.alert("Select a dataset from the selector in the navbar!")
            return;
        }
        var range = Math.abs($scope.slider.from - $scope.slider.to);
        if (range < 0) {
            window.alert("At least one frame must be selected.")
            return;
        }
        $state.go('tool', { obj: { from: $scope.slider.from, to: $scope.slider.to } });
    };
}]);