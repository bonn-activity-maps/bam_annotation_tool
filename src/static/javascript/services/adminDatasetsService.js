angular.module('CVGTool')

    .factory('adminDatasetsSrvc', function ($state, $http, $httpParamSerializer) {

      return {
          getInfoOfVideos: function (callbackSuccess, activeDataset) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/getVideos',
                  headers: {
                      'dataset': activeDataset
                  }
              }).then(function successCallback(response) {
                  if (response.data.msg.length === 0) {
                    callbackSuccess([])
                  } else {
                    callbackSuccess(response.data.msg)
                  }
                }, function errorCallback(response) {
                  console.log("ERROR while retrieving info from videos.")
              });
          },

          unwrapVideo: function (videoName, dataset, callbackFinished) {
              $http({
                  method: 'POST',
                  url: '/api/dataset/unwrapVideo',
                  data: {
                    'name': videoName,
                    'dataset': dataset
                  }
              }).then(function successCallback(response) {
                // TODO: add action when unwrap is finished
                  callbackFinished(videoName, dataset)
                }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },

          removeVideo: function (videoName, dataset, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/dataset/removeVideo',
                data: {
                    'name': videoName,
                    'dataset': dataset
                }
              }).then(function successCallback(response) {
                  callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          },

          renameVideo: function (oldVideoName, newVideoName, dataset, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/dataset/renameVideo',
                data: {
                    'oldName': oldVideoName,
                    'newName': newVideoName,
                    'dataset': dataset
                }
              }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                    callbackError(response.data.msg)
              });
          },

          updateVideoFrames: function(videoName, dataset, callback) {
              $http({
                  method: 'POST',
                  url: '/api/dataset/updateVideoFrames',
                  data: {
                      'name': videoName,
                      'dataset': dataset
                  }
              }).then(function successCallback(response) {
                  callback();
                  console.log("Updated frames for video ", videoName, " in database")
              }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          }
      }
});
