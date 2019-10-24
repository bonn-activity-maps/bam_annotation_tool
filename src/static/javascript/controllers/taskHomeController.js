angular.module('CVGTool')

/*
 * Controller of admin page "Users"
 */
.controller('taskHomeCtrl', ['$scope', '$rootScope', '$state', '$mdDialog', 'navSrvc', 'taskHomeSrvc', 'adminDatasetsSrvc',
    function($scope, $rootScope, $state, $mdDialog, navSrvc, taskHomeSrvc, adminDatasetsSrvc) {

        $scope.initialFrame = 0;
        $scope.slider = { // Options and values for the slider
            range: 1,
            options: {
                floor: 0,
                ceil: 100,
                step: 1,
                showSelectionBar: true
            }
        };

        // Function called everytime the number input of the slider is changed to check those values
        $scope.checkSlider = function() {
            if ($scope.initialFrame < $scope.slider.options.floor) {
                $scope.initialFrame = $scope.slider.options.floor;
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

            if ($scope.slider.range <= 0 || $scope.slider.range > $scope.slider.options.ceil ) {
                window.alert("Choose a frame range between 1 and "+ $scope.slider.options.ceil +".");
                return;
            }

            if ($scope.initialFrame < 0) {
                window.alert("Initial frame must be at least 0");
                return;
            }

            // Check if the dataset is "AIK" to change the starting frame in case its 0. (Only PT has frame 0)
            if (navSrvc.getActiveDataset().type.localeCompare("actionInKitchen") == 0 && $scope.initialFrame == 0) {
                $scope.initialFrame = 1;
            }
            // Update navBar info
            navSrvc.setFrameStart($scope.initialFrame);
            navSrvc.setFrameEnd($scope.initialFrame + $scope.slider.range);
            navSrvc.setFrameRange($scope.slider.range);

            // Go to the tool screen
            $state.go('tool', { obj: { from: $scope.initialFrame, to: $scope.initialFrame + $scope.slider.range, originalRange: $scope.slider.range, loadedCameras: [], canvasCameras: ["", "", "", ""], fromTaskHome: true } });
        };

        // Send message to toast
        var sendMessage = function(type, msg) {
            $rootScope.$broadcast('sendMsg', { 'type': type, 'msg': msg });
        };

    }
]);