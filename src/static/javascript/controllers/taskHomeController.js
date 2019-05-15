angular.module('CVGTool')

    /*
     * Controller of admin page "Users"
     */
    .controller('taskHomeCtrl', ['$scope', '$state', '$mdDialog', function ($scope, $state, $mdDialog) {
          $scope.goToTool = function() {
            $state.go('tool');
          }
    }]);
