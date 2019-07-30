angular.module('CVGTool')

/*
 * Controller of the dialog of the "rename stored video as administrator" action
 */
//.controller('dialogRenameVideoCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//    function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//    $scope.mode = 'normal';
//    $scope.msg = '';
//    $scope.inputMsg = '';
//     $scope.inputError = false;
//
//    $scope.oldName = video.name;
//     $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
//
// //Function to cancel all actions and close the dialog
//    $scope.cancel = function () {
//      $mdDialog.cancel();
//     }
//
// //Callback function if the rename worked
//    var showSuccess = function (response) {
//      $scope.mode = 'success';
//      $scope.msg = 'Video successfully renamed.'
//     }
//
// //Callback function if the rename didnt worked
//    var showError = function (response) {
//      $scope.mode = 'error';
//      $scope.msg = 'There was an error when renaming the video.'
//     }
//
// //Function to hide the error messages on click
//     $scope.hiddeError = function () {
//      $scope.inputError = false;
//      $scope.inputMsg = '';
//     }
//
//     // Function that generates the call to the server to rename the file
//     // It does some simple checking (not blank and different from the old name)
//     $scope.rename = function() {
//       if ($scope.newName.name === undefined) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name can't be blank.";
//       } else if ($scope.newName.name.localeCompare($scope.oldName) === 0 ) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name must be different from the old name.";
//       } else {
//         var newVideoName = $scope.newName.name + video.extension;
//         var oldVideoName = $scope.oldName + video.extension;
//         adminDatasetsSrvc.renameVideo(oldVideoName, newVideoName, navSrvc.getActiveDataset(), showSuccess, showError)
//       }
//     }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
//.controller('dialogRemoveVideoCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//    function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//     var videoName = video.name + video.extension;
//
//    $scope.mode = 'normal';
//     $scope.msg = '';
//
// //Function to cancel all actions and close the dialog
//    $scope.cancel = function () {
//      $mdDialog.cancel();
//     }
//
// //Recall function if the rename worked
//    var showSuccess = function (response) {
//      $scope.mode = 'success';
//      $scope.msg = 'Video successfully removed.'
//     }
//
// //Recall function if the rename didnt worked
//    var showError = function (response) {
//      $scope.mode = 'error';
//      $scope.msg = 'There was an error when deleting the video.'
//     }
//
// //Function that generates the call to the server to remove the file
//    $scope.remove = function () {
//       adminDatasetsSrvc.removeVideo(videoName, navSrvc.getActiveDataset(), showSuccess, showError)
//    }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
.controller('dialogRemoveDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Dataset successfully removed.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when deleting the dataset.'
        };

        // Function that generates the call to the server to remove the file
        $scope.remove = function() {
            adminDatasetsSrvc.removeDataset(name, showSuccess, showError)
        }
    }
])

.controller('dialogExportDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Dataset successfully exported.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when exporting the dataset.'
        };

        // Function that generates the call to the server to remove the file
        $scope.export = function() {
            adminDatasetsSrvc.exportDataset(name, showSuccess, showError)
        }
    }
])

/*
 * Controller of the dialog of the "remove stored user as administrator" action
 */
.controller('dialogRemoveUserCtrl', ['$scope', 'adminUsersSrvc', '$mdDialog', 'username', function($scope, adminUsersSrvc, $mdDialog, username) {
    var user = username;

    console.log(user);
    $scope.mode = 'normal';
    $scope.msg = '';

    // Function that generates the call to the server to remove the file
    $scope.remove = function() {
        adminUsersSrvc.removeUser(user, showSuccess, showError)
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    // Recall function if the rename worked
    var showSuccess = function(response) {
        $scope.mode = 'success';
        $scope.msg = 'User successfully removed.'
    };

    // Recall function if the rename didnt worked
    var showError = function(response) {
        $scope.mode = 'error';
        $scope.msg = 'There was an error when deleting the user.'
    }

}])


/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
.controller('dialogCameraSelectorCtrl', ['$scope', '$mdDialog', 'video', 'canvases', function($scope, $mdDialog, video, canvases) {
    $scope.variables = {
        video: video,
        canvases: canvases
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.switchTo = function(number) {
        $scope.data = {
            video: $scope.variables.video,
            number: number
        };
        $mdDialog.hide($scope.data);
    }
}])

/*
 * Controller of the dialog of show password
 */
.controller('dialogShowPasswordCtrl', ['$scope', '$mdDialog', 'username', 'password', function($scope, $mdDialog, username, password) {
    $scope.variables = {
        username: username,
        password: password
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    }
}])

/*
 * Controller of the dialog of show zip files
 */
.controller('dialogShowZipFilesCtrl', ['$scope', '$mdDialog', 'files', 'adminDatasetsSrvc',
    function($scope, $mdDialog, files, adminDatasetsSrvc) {
        console.log("Files: " + files);
        $scope.variables = {
            files: files,
            datasetType: ''
        };

        $scope.filename = '';
        $scope.success = false;
        $scope.mode = 'normal';
        $scope.msg = '';

        // Select a zip to load
        $scope.selectZip = function(file) {
            $scope.filename = file.name;
            $scope.mode = 'progress';
            adminDatasetsSrvc.loadZip(file.name, $scope.variables.datasetType, showSuccess, showError);
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = response;
            $scope.success = true;
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = response;
            $scope.success = false;
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $scope.successData = {
                success: $scope.success,
                filename: $scope.filename,
                type: $scope.variables.datasetType
            };
            $mdDialog.hide($scope.successData);
        }
    }
])

/*
 * Controller of the dialog of the "Add new camera to the camera array" action
 */
.controller('dialogAddNewCameraCtrl', ['$scope', '$timeout', 'toolSrvc', 'navSrvc', '$mdDialog', 'frameFrom', 'frameTo',
    function($scope, $timeout, toolSrvc, navSrvc, $mdDialog, frameFrom, frameTo) {
        $scope.isVideoSelected = false;
        $scope.videoSelected;
        $scope.search = {}; // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
        $scope.listOfVideos = [];
        $scope.listOfVideosToShow = [];
        $scope.retrievingData = false;
        $scope.doneRetrievingData = false;
        $scope.targetFrames;
        $scope.retrievedFrames;

        $scope.frameFrom = frameFrom;
        $scope.frameTo = frameTo;

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Function to update the list of videos using the searchbar
        $scope.searchInListOfVideos = function() {
            if ($scope.search.str === undefined) {

            } else {
                $scope.listOfVideosToShow = [];

                $scope.listOfVideos.forEach(function(video) {
                    if (video.name.includes($scope.search.str.toString())) {
                        $scope.listOfVideosToShow.push(video);
                    }
                });
            }
        };

        // Function that manages item selection
        $scope.selectItem = function(video) {
            $scope.isVideoSelected = true; // TODO: FInish the selection of the video, I have to use the bypass (the same way than with search)
            $scope.videoSelected = video.video;
        };

        // Function to update the list of videos
        var showListOfVideos = function(list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
                $scope.listOfVideos.push({
                    "name": list[i].name,
                    "extension": list[i].extension,
                    "duration": list[i].duration,
                    "frames": list[i].frames
                });
            }
            $scope.listOfVideosToShow = $scope.listOfVideos.slice();
        };

        // Recall function if the rename worked
        $scope.getListOfVideos = function() {
            toolSrvc.getInfoOfVideos(showListOfVideos, navSrvc.getActiveDataset().name);
        };

        // Function to go back from the dialog once the frames have been retrieved from the server
        $scope.end = function() {
            $mdDialog.hide($scope.retrievedFrames);
        };

        // Function that will be called everytime a frame has been retrieved from the server
        var callbackRetrievingFrame = function(image, fileName, frame) {
            $scope.retrievedFrames.push({ // Store the retrieved frame
                image: image,
                filename: fileName,
                frame: parseInt(frame)
            });

            // Check if we are done
            if ($scope.retrievedFrames.length == $scope.targetFrames) {
                $scope.end();
            }
        };

        // Function to retrieve the selected frame range from the selected video
        $scope.accept = function() {
            var range = Math.abs($scope.frameFrom - $scope.frameTo);
            $scope.retrievingData = true;
            $scope.targetFrames = range + 1;
            $scope.retrievedFrames = [];

            // Make all the petitions
            for (var i = 0;
                ($scope.frameFrom + i) < $scope.frameTo + 1; i++) {
                toolSrvc.getFrame($scope.videoSelected.name, $scope.frameFrom + i, navSrvc.getActiveDataset().name,
                    callbackRetrievingFrame);
            }

        };

        $scope.getListOfVideos();

    }
]);