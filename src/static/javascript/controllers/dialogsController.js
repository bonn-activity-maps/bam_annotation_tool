angular.module('CVGTool')

    /*
     * Controller of the dialog of the "rename stored video as administrator" action
     */
    .controller('dialogRenameVideoCtrl', ['$scope','adminVideosSrvc', '$mdDialog', 'video', function ($scope, adminVideosSrvc, $mdDialog, video) {
        $scope.mode = 'normal';
        $scope.msg = '';
        $scope.inputMsg = '';
        $scope.inputError = false;

        $scope.oldName = video.name;
        $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.hide();
        }

        // Callback function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully renamed.'
        }

        // Callback function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when renaming the video.'
        }

        // Function to hide the error messages on click
        $scope.hiddeError = function() {
          $scope.inputError = false;
          $scope.inputMsg = '';
        }

        // Function that generates the call to the server to rename the file
        // It does some simple checking (not blank and different from the old name)
        $scope.rename = function() {
          if ($scope.newName.name === undefined) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name can't be blank.";
          } else if ($scope.newName.name.localeCompare($scope.oldName) == 0 ) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name must be different from the old name.";
          } else {
            var newVideoName = $scope.newName.name + '.' + video.extension;
            var oldVideoName = $scope.oldName + '.' + video.extension;
            adminVideosSrvc.renameVideo(oldVideoName, newVideoName, showSuccess, showError)
          }
        }
    }])

    /*
     * Controller of the dialog of the "remove stored video as administrator" action
     */
    .controller('dialogDeleteVideoCtrl', ['$scope','adminVideosSrvc', '$mdDialog', 'video', function ($scope, adminVideosSrvc, $mdDialog, video) {
        console.log(video)
        var videoName = video.name + '.' + video.extension;

        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.hide();
        }

        // Recall function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully deleted.'
        }

        // Recall function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when deleting the video.'
        }

        // Function that generates the call to the server to delete the file
        $scope.delete = function() {
          adminVideosSrvc.deleteVideo(videoName, showSuccess, showError)
        }
    }])

    /*
     * Controller of the dialog of the "Add new camera to the camera array" action
     */
    .controller('dialogAddNewCameraCtrl', ['$scope','homeSrvc', '$mdDialog', function ($scope, homeSrvc, $mdDialog) {
        $scope.isVideoSelected = false;
        $scope.videoSelected;
        $scope.search = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
        $scope.listOfVideos = [];
        $scope.listOfVideosToShow = [];

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.hide();
        }

        // Function to update the list of videos using the searchbar
        $scope.searchInListOfVideos = function () {
            if ($scope.search.str === undefined) {
                return;
            } else {
              $scope.listOfVideosToShow = [];

              $scope.listOfVideos.forEach(function(video) {
                if (video.name.includes($scope.search.str.toString())){
                    $scope.listOfVideosToShow.push(video);
                }
              });
            }
        }

        // Function that manages item selection
        $scope.selectItem = function (video) {
            $scope.isVideoSelected = true;      // TODO: FInish the selection of the video, I have to use the bypass (the same way than with search)
            console.log(video.video)
            console.log(video.video.name)
            $scope.videoSelected = video.video
        }

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i].substr(0, list[i].lastIndexOf('.')), "extension": list[i].substr(list[i].lastIndexOf('.')+1, list[i].length) , "duration": 0});
            }
            $scope.listOfVideosToShow = $scope.listOfVideos.slice();
        };

        // Recall function if the rename worked
        $scope.getListOfVideos = function() {
            homeSrvc.getInfoOfVideos(showListOfVideos);
        }

        $scope.getListOfVideos();

    }]);
