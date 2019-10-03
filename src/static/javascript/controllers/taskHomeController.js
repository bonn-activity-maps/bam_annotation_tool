angular.module('CVGTool')

/*
 * Controller of admin page "Users"
 */
.controller('taskHomeCtrl', ['$scope', '$rootScope', '$state', '$mdDialog', 'navSrvc', 'taskHomeSrvc', 'adminDatasetsSrvc',
    function($scope, $rootScope, $state, $mdDialog, navSrvc, taskHomeSrvc, adminDatasetsSrvc) {

        $scope.slider = { // Options and values for the slider
            from: 0,
            to: 1,
            options: {
                floor: 0,
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
        };

        $scope.isPosetrack = function() {
            return navSrvc.getActiveDataset().type.localeCompare("poseTrack") === 0;
        };

        $scope.videos = [];

        $scope.fillTableFrames = function(frameInfoOfVideo, video) {
            for (let i = 0; i < $scope.videos.length; i++) {
                if ($scope.videos[i].name.localeCompare(video) === 0) {
                    $scope.videos[i].frameStart = frameInfoOfVideo[0].number;
                    $scope.videos[i].frameEnd = frameInfoOfVideo[1].number;
                    break;
                }
            }
        };

        $scope.fillTable = function(videos) {
            $scope.videos = videos;
            if (videos !== []) {
                for (let i = 0; i < videos.length; i++) {
                    taskHomeSrvc.getFrameInfo(navSrvc.getActiveDataset().name, videos[i].name, $scope.fillTableFrames, sendMessage)
                }
            }
        };

        $scope.loadVideoTable = function() {
            if (navSrvc.getActiveDataset() === undefined || navSrvc.getActiveDataset().name === undefined || navSrvc.getActiveDataset().name.localeCompare("") === 0) {
                window.alert("Select a dataset from the selector in the navbar!");
                return;
            }
            if (!$scope.isPosetrack()) {
                sendMessage('danger', 'Please ignore the button you just pressed. I was in a hurry :-)');
                return;
            }
            adminDatasetsSrvc.getInfoOfVideos($scope.fillTable, navSrvc.getActiveDataset().name, sendMessage);
        };

        $scope.goToTool = function() {
            if (navSrvc.getActiveDataset() === undefined || navSrvc.getActiveDataset().name === undefined || navSrvc.getActiveDataset().name.localeCompare("") === 0) {
                window.alert("Select a dataset from the selector in the navbar!");
                return;
            }

            var range = Math.abs($scope.slider.from - $scope.slider.to);
            if (range < 0) {
                window.alert("At least one frame must be selected.");
                return;
            }

            if ($scope.slider.from > $scope.slider.to) {
                window.alert("The value of 'from' cannot be higher than the value of 'to'.");
                return;
            }

            // Check if the dataset is "AIK" to change the starting frame in case its 0. (Only PT has frame 0)
            if (navSrvc.getActiveDataset().type.localeCompare("actionInKitchen") == 0 && $scope.slider.from == 0) {
                $scope.slider.from = 1;
            }

            $state.go('tool', { obj: { from: $scope.slider.from, to: $scope.slider.to } });
        };

        // Send message to toast
        var sendMessage = function(type, msg) {
            $rootScope.$broadcast('sendMsg', { 'type': type, 'msg': msg });
        };

    }
]);