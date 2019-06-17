angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', 'navSrvc', 'adminDatasetsSrvc',
        function ($scope, $state, navSrvc, adminDatasetsSrvc) {
            $scope.user = {
                name: "",
                email: "",
                role: "",
                assignedTo: []
            };

            $scope.activeDataset = {
                name: "",
                type: ""
            };

            // Set activeDataset to dataset
            $scope.setActiveDataset = function(dataset) {
                $scope.activeDataset = dataset;
                navSrvc.setActiveDataset(dataset);
            };

            $scope.getUserInfo = function () {
                $scope.user = navSrvc.getUser();
                $scope.activeDataset = navSrvc.getActiveDataset();
                console.log($scope.activeDataset.name);
            };

            $scope.loggedIn = function () {
                return $state.current.name !== 'login';
            };

            $scope.logOut = function () {
                navSrvc.logout();
            };

            // Activated when clicked on dropdown
            $scope.selectDataset = function (name) {
                adminDatasetsSrvc.getDataset(name, $scope.setActiveDataset);
            };

            // Watcher that detects changes in the state to get the info
            var watcher = $scope.$watch(function () {
                return $state.$current.name
            }, function (newVal, oldVal) {
                if (oldVal.localeCompare('login') === 0) {
                    $scope.getUserInfo();
                }
            })

        }]);
